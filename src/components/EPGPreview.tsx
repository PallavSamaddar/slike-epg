import { useState, useRef, useEffect, FC, useMemo, useCallback } from 'react';
import { Download, FileText, Code, Database, Settings, RefreshCw, Plus, Copy, Edit, GripVertical, ClipboardCopy, FileDown, ChevronDown, Check, Eye, AlertTriangle } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ManageAdsModal } from './ManageAdsModal';
import { RepeatScheduleModal } from './RepeatScheduleModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import WeeklyView from './WeeklyView';
import MonthlyView from './MonthlyView';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from "@/components/ui/toaster";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EPGPreviewItem {
  id: string;
  time: string;
  title: string;
  type: 'VOD' | 'Event';
  duration: number;
  geoZone: string;
  description?: string;
  status: 'live' | 'scheduled' | 'completed';
  genre: string;
  isEditing?: boolean;
  imageUrl?: string;
}

const SortableItem = ({ id, children }: { id: string, children: (listeners: Record<string, unknown>) => React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </div>
    );
};

// Function to get random poster image
const getRandomPoster = () => {
    const posters = ['/poster-1.jpg', '/poster-2.jpg', '/poster-3.jpg', '/poster-4.jpg', '/poster-5.jpg', '/poster-6.jpg'];
    return posters[Math.floor(Math.random() * posters.length)];
};

const generateDummyProgramsForDate = (date: Date, idOffset: number): EPGPreviewItem[] => {
    const dateString = date.toISOString().split('T')[0];
    return [
        { id: `d-${idOffset + 1}`, time: `${dateString}T09:00`, title: 'Morning Show', type: 'Event', duration: 120, geoZone: 'Global', description: 'A morning talk show.', status: 'scheduled', genre: 'Talk Show', imageUrl: getRandomPoster() },
        { id: `d-${idOffset + 2}`, time: `${dateString}T11:00`, title: 'Cartoon Fun', type: 'VOD', duration: 60, geoZone: 'Global', description: 'Animated series for kids.', status: 'scheduled', genre: 'Kids', imageUrl: getRandomPoster() },
        { id: `d-${idOffset + 3}`, time: `${dateString}T15:00`, title: 'Indie Films', type: 'VOD', duration: 180, geoZone: 'US/EU', description: 'A selection of independent movies.', status: 'scheduled', genre: 'Movies', imageUrl: getRandomPoster() },
        { id: `d-${idOffset + 4}`, time: `${dateString}T20:00`, title: 'Rock Anthems', type: 'VOD', duration: 60, geoZone: 'Global', description: 'Classic rock music videos.', status: 'scheduled', genre: 'Music', imageUrl: getRandomPoster() },
    ];
};

type ViewMode = 'daily' | 'weekly' | 'monthly';

export const EPGPreview = () => {
  const [selectedFormat, setSelectedFormat] = useState('xmltv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [distributor, setDistributor] = useState('Gracenote');
  const [activeTab, setActiveTab] = useState('master-epg');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
      return (localStorage.getItem('epgViewMode') as ViewMode) || 'daily';
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectDateTabLabel, setSelectDateTabLabel] = useState('Select Date');

  // Tab management state
  const [tabs, setTabs] = useState([
    { id: 'master-epg', label: 'Master EPG', isStatic: true, isClosable: false },
    { id: 'todays-epg', label: "Today's EPG", isStatic: true, isClosable: false },
    { id: 'weekly-epg', label: 'Weekly EPG', isStatic: true, isClosable: false },
    { id: 'monthly-epg', label: 'Monthly EPG', isStatic: true, isClosable: false },
    { id: 'select-date', label: selectDateTabLabel, isStatic: true, isClosable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState('master-epg');

  const [isManageAdsModalOpen, setIsManageAdsModalOpen] = useState(false);
const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
      const [editingGenres, setEditingGenres] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSelectDateCalendarOpen, setIsSelectDateCalendarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftChannel, setDraftChannel] = useState<null | { id: string; name: string; description?: string; posterDataUrl?: string; resolution?: string; primaryGenre?: string | null; language?: string | null }>(null);
  const isDraftMode = !!draftChannel;
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem('epgViewMode', viewMode);
  }, [viewMode]);

  // Update tabs when selectDateTabLabel changes
  useEffect(() => {
    setTabs(prev => prev.map(tab => 
      tab.id === 'select-date' ? { ...tab, label: selectDateTabLabel } : tab
    ));
  }, [selectDateTabLabel]);

  // Handle click outside calendar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectDateCalendarOpen) {
        const target = event.target as HTMLElement;
        // Check if click is outside the calendar dropdown
        if (!target.closest('.calendar-dropdown') && !target.closest('[data-tab-id="select-date"]')) {
          setIsSelectDateCalendarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectDateCalendarOpen]);

  // Handle tab switching
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    // do not reset unsaved flag on view switches; keep changes until saved
    
    // Map tab IDs to view modes and active tabs
    switch (tabId) {
      case 'master-epg':
        setActiveTab('master-epg');
        break;
      case 'todays-epg':
        setActiveTab('schedule-view');
        setViewMode('daily');
        setSelectedDate(new Date());
        break;
      case 'weekly-epg':
        setActiveTab('schedule-view');
        setViewMode('weekly');
        break;
      case 'monthly-epg':
        setActiveTab('schedule-view');
        setViewMode('monthly');
        break;
      case 'select-date':
        // Toggle the calendar dropdown when "Select Date" tab is clicked
        setIsSelectDateCalendarOpen(!isSelectDateCalendarOpen);
        // Set the view to schedule-view with daily mode for the selected date
        setActiveTab('schedule-view');
        setViewMode('daily');
        break;
      default:
        // Handle dynamic tabs (date-specific) - legacy support
        if (tabId.startsWith('date-')) {
          const dateStr = tabId.replace('date-', '');
          const date = new Date(dateStr);
          setActiveTab('schedule-view');
          setViewMode('daily');
          setSelectedDate(date);
        }
        break;
    }
  };

  // Centralized navigation: open a specific date in Select Date tab
  const goToDateInSelectDateTab = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    const dateLabel = normalized.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    setSelectDateTabLabel(dateLabel);
    setSelectedDate(normalized);
    setActiveTab('schedule-view');
    setActiveTabId('select-date');
    setIsSelectDateCalendarOpen(false);
    setHasUnsavedChanges(false);
  };

  const handleDateChangeFromCalendar = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    goToDateInSelectDateTab(date);
  };

  // Save button enablement and tooltip messages
  const isSaveEpgEnabled = (): boolean => {
    if (activeTabId === 'weekly-epg' || activeTabId === 'monthly-epg') return false;
    if (activeTabId === 'select-date' && selectDateTabLabel === 'Select Date') return false;
    return hasUnsavedChanges;
  };

  const getSaveEpgTooltipMessage = (): string => {
    if (activeTabId === 'select-date' && selectDateTabLabel === 'Select Date') return 'Please select a date to save EPG';
    if (!hasUnsavedChanges) return 'No changes to save';
    return '';
  };

  // Add dynamic tab when date is selected from calendar


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).closest('input, textarea, select')) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'd':
                setViewMode('daily');
                break;
            case 'w':
                setViewMode('weekly');
                break;
            case 'm':
                setViewMode('monthly');
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [mockEPGData, setMockEPGData] = useState<EPGPreviewItem[]>(() => {
    try {
      const rawDraft = localStorage.getItem('fastChannelDraft');
      if (rawDraft) {
        return [];
      }
    } catch {}
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const initialPrograms: EPGPreviewItem[] = [];
    const genres = ['News','Movies','Sports','Music','Comedy','Documentary','Talk Show','Games','Cooking'];
    const titles = [
      'Midnight Kickoff','Early Hour Highlights','Dawn Documentaries','Sunrise Show','Morning Mix',
      'Daily Briefing','Brunch Beats','Noon News','Afternoon Feature','Tea Time Talk',
      'Drive Time Hits','Evening Update','Prime Stories','Family Hour','Twilight Tunes',
      'Dusk Drama','Evening Magazine','Pre-Prime Recap','Prime Preview','Late Rush','Late Feature'
    ];
    // Build hourly programs from 00:00 to 20:00
    for (let hour = 0; hour <= 20; hour++) {
      const hh = String(hour).padStart(2, '0');
      const title = titles[hour % titles.length] || `Program ${hh}:00`;
      const genre = genres[hour % genres.length];
      initialPrograms.push({
        id: `m-${hour}`,
        time: `${todayStr}T${hh}:00`,
        title,
        type: hour % 2 === 0 ? 'VOD' : 'Event',
        duration: 60,
        geoZone: 'Global',
        description: `${title} - ${genre} segment`,
        status: 'scheduled',
        genre,
        imageUrl: getRandomPoster(),
      });
    }

    for (let i = 1; i <= 7; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        initialPrograms.push(...generateDummyProgramsForDate(nextDate, initialPrograms.length));
    }

    for (let i = 1; i <= 3; i++) {
        const prevDate = new Date();
        prevDate.setDate(today.getDate() - i);
        initialPrograms.push(...generateDummyProgramsForDate(prevDate, initialPrograms.length));
    }
    
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(today.getMonth() + 1, 5);
    initialPrograms.push(...generateDummyProgramsForDate(nextMonthDate, initialPrograms.length));
    
    return initialPrograms;
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fastChannelDraft');
      setDraftChannel(raw ? JSON.parse(raw) : null);
    } catch {
      setDraftChannel(null);
    }
  }, []);

  // If navigated here from Copy EPG button on channel card, open the modal
  useEffect(() => {
    try {
      const flag = localStorage.getItem('epg:openCopyModal');
      if (flag) {
        setIsRepeatModalOpen(true);
        localStorage.removeItem('epg:openCopyModal');
      }
    } catch {}
  }, []);

  // Warn on page close if draft exists and no programs have been added
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      const hasDraft = !!localStorage.getItem('fastChannelDraft');
      const hasPrograms = mockEPGData.length > 0 || localStorage.getItem('fastChannelDraftHasPrograms') === 'true';
      if (hasDraft && !hasPrograms) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [mockEPGData.length]);

  // Memoized slices to reduce filtering work per render
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPrograms = useMemo(() => mockEPGData.filter(i => i.time.startsWith(todayKey)), [mockEPGData, todayKey]);
  const selectedKey = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  const selectedDayPrograms = useMemo(() => mockEPGData.filter(i => i.time.startsWith(selectedKey)), [mockEPGData, selectedKey]);

  // Persist a single day's programs for TOI Global to consume
  const persistDaySchedule = (date: Date) => {
    const key = `epg:preview:day:${date.toISOString().split('T')[0]}`;
    const dayStr = date.toISOString().split('T')[0];
    const dayItems = mockEPGData.filter(p => p.time.startsWith(dayStr));
    try {
      localStorage.setItem(key, JSON.stringify(dayItems));
    } catch {}
  };
  
    const handleAdSave = (adConfig: Record<string, unknown>) => {
        console.log('Ad config saved:', adConfig);
        setIsManageAdsModalOpen(false);
    };

    const handleRepeatSave = (startDate: string, endDate: string, selectedDays: number[]) => {
        console.log('Repeat schedule saved:', { startDate, endDate, selectedDays });
        setIsRepeatModalOpen(false);
    };

    const { toast } = useToast();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setMockEPGData((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                if (oldIndex === -1 || newIndex === -1) {
                    return items; // One of the items not found, do not update
                }
                
                const liveItemIndex = items.findIndex(item => item.status === 'live');

                // Prevent dropping items at or before the live program only in schedule-view
                if (activeTab === 'schedule-view' && liveItemIndex !== -1 && newIndex <= liveItemIndex) {
                    toast({
                        title: "Action Restricted",
                        description: "Cannot move items above the live program.",
                        variant: "destructive",
                    });
                    return items;
                }

                return arrayMove(items, oldIndex, newIndex);
            });
            setHasUnsavedChanges(true);
        }
    };
    
    const [editingProgram, setEditingProgram] = useState<EPGPreviewItem | null>(null);
    
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number) => {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const minutesToTimeAMPM = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const ampm = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMins = mins.toString().padStart(2, '0');
        return `${displayHours}:${displayMins}${ampm}`;
    };

    const availableGenres = ['Movies', 'Classic', 'Games', 'Fun', 'Sports', 'News', 'Entertainment', 'Documentary', 'Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Family', 'Kids', 'Weather', 'Talk Show', 'Quiz', 'Lifestyle', 'Finance', 'Music', 'World', 'Cooking'];

    const toggleEditMode = (id: string) => {
        setMockEPGData(prev => prev.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : { ...item, isEditing: false }));
        // editing toggle does not mark changes yet
    };

    const toggleGenreEdit = (id: string) => {
        setEditingGenres(editingGenres === id ? null : id);
    };

    const updateGenre = (id: string, newGenre: string) => {
        setMockEPGData(prev => prev.map(item => item.id === id ? { ...item, genre: newGenre } : item));
        setEditingGenres(null);
        setHasUnsavedChanges(true);
    };

    const handleSaveProgram = (item: EPGPreviewItem) => {
        if (editingProgram) {
            setMockEPGData(prev => prev.map(p => p.id === item.id ? item : p));
            toast({ title: 'Program updated successfully' });
        } else {
            setMockEPGData(prev => [...prev, item].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)));
            toast({ title: `${item.type} Block added successfully` });
        }
        setEditingProgram(null);
        setHasUnsavedChanges(true);
        try {
          if (localStorage.getItem('fastChannelDraft')) {
            localStorage.setItem('fastChannelDraftHasPrograms', 'true');
          }
        } catch {}
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveEpg = () => {
        // If in draft mode, enforce at least one program before creation
        if (isDraftMode) {
            if (mockEPGData.length === 0) {
                toast({ title: 'Add at least one program', description: 'Please add a program to your new channel before saving.', variant: 'destructive' });
                return;
            }
        }
        // Save Master EPG for next 15 days
        if (activeTabId === 'master-epg') {
            setIsSaving(true);
            setTimeout(() => {
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                
                const masterPrograms = mockEPGData.filter(p => p.time.startsWith(todayString));
                
                const nonMasterDayPrograms = mockEPGData.filter(p => !p.time.startsWith(todayString));
                
                const futureDates: string[] = [];
                for (let i = 1; i <= 15; i++) {
                    const futureDate = new Date();
                    futureDate.setDate(today.getDate() + i);
                    futureDates.push(futureDate.toISOString().split('T')[0]);
                }
                
                const newFuturePrograms = futureDates.flatMap(date =>
                    masterPrograms.map(p => ({
                        ...p,
                        id: `${p.id}-mastercopy-${date}-${Math.random()}`,
                        time: `${date}T${p.time.split('T')[1]}`,
                        status: 'scheduled',
                    }))
                );

                const programsToKeep = nonMasterDayPrograms.filter(p => !futureDates.includes(p.time.split('T')[0]));
                
                setMockEPGData([...masterPrograms, ...programsToKeep, ...newFuturePrograms]);
                // Persist today's schedule for TOI Global
                persistDaySchedule(today);
                setIsSaving(false);
                setHasUnsavedChanges(false);
                toast({
                    title: 'Master EPG saved',
                    description: 'Master EPG saved and updated for the next 15 days.',
                });
                // Finalize draft channel after a successful save
                if (isDraftMode) {
                  try {
                    const draftRaw = localStorage.getItem('fastChannelDraft');
                    if (draftRaw) {
                      const draft = JSON.parse(draftRaw);
                      const rawList = localStorage.getItem('fastChannels');
                      const list = rawList ? JSON.parse(rawList) : [];
                      list.push({ id: draft.id, name: draft.name, resolution: draft.resolution || '1080p', status: 'offline', posterDataUrl: draft.posterDataUrl, language: draft.language });
                      localStorage.setItem('fastChannels', JSON.stringify(list));
                    }
                  } catch {}
                  localStorage.removeItem('fastChannelDraft');
                  localStorage.removeItem('fastChannelDraftHasPrograms');
                  setDraftChannel(null);
                  toast({ title: 'Channel created', description: 'Your channel has been created in Offline mode.' });
                }
            }, 500);
            return;
        }

        // Save single-day EPG for Today's or Selected Date views
        if (activeTabId === 'todays-epg' || activeTabId === 'select-date' || activeTabId.startsWith('date-')) {
            const dateToSave = selectedDate;
            const formatted = dateToSave.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            setIsSaving(true);
            setTimeout(() => {
                // Persist only this selected date
                persistDaySchedule(dateToSave);
                setIsSaving(false);
                setHasUnsavedChanges(false);
                toast({
                    title: 'EPG saved',
                    description: `Schedule for ${formatted} saved successfully.`,
                });
                if (isDraftMode) {
                  try {
                    const draftRaw = localStorage.getItem('fastChannelDraft');
                    if (draftRaw) {
                      const draft = JSON.parse(draftRaw);
                      const rawList = localStorage.getItem('fastChannels');
                      const list = rawList ? JSON.parse(rawList) : [];
                      list.push({ id: draft.id, name: draft.name, resolution: draft.resolution || '1080p', status: 'offline', posterDataUrl: draft.posterDataUrl, language: draft.language });
                      localStorage.setItem('fastChannels', JSON.stringify(list));
                    }
                  } catch {}
                  localStorage.removeItem('fastChannelDraft');
                  localStorage.removeItem('fastChannelDraftHasPrograms');
                  setDraftChannel(null);
                  toast({ title: 'Channel created', description: 'Your channel has been created in Offline mode.' });
                }
            }, 400);
            return;
        }

        // Weekly/Monthly remains disabled via button state; guard for safety
        toast({
            title: 'Save not available',
            description: 'Switch to Master, Today, or Select Date to save.',
            variant: 'destructive',
        });
    };

    const ProgramItem = ({ item, isDraggable, listeners, showStatus = true }: { item: EPGPreviewItem, isDraggable: boolean, listeners?: Record<string, unknown>, showStatus?: boolean }) => {
        return (
            <div className="p-3 rounded bg-background border border-border flex items-start gap-4">
                <div className="flex-shrink-0 w-40 text-center">
                    <div className="w-40 h-24 overflow-hidden rounded-sm">
                        <img loading="lazy" src={item.imageUrl || '/toi_global_poster.png'} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-mono text-broadcast-blue mt-1">
                        {formatTimeRange(item.time.split('T')[1], item.duration)}
                    </span>
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isDraggable && <GripVertical className="cursor-grab" {...listeners} />}
                            {item.isEditing ? (
                                <Input
                                    value={item.title}
                                    onChange={(e) => {
                                      setMockEPGData(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i));
                                      setHasUnsavedChanges(true);
                                    }}
                                    onBlur={() => toggleEditMode(item.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            toggleEditMode(item.id);
                                        }
                                    }}
                                    className="text-sm font-medium bg-white/90 text-black border-none h-6 px-1"
                                    autoFocus
                                />
                            ) : (
                                <span className="font-medium text-sm truncate text-black" onClick={() => toggleEditMode(item.id)}>
                                    {item.title}
                                </span>
                            )}
                                <button onClick={() => toggleEditMode(item.id)} className={`flex-shrink-0 p-1 rounded hover:bg-black/20 text-black`}>
                                <Edit className="h-3 w-3" />
                            </button>
                            <div className="flex gap-1 ml-2 relative">
                                {editingGenres === item.id ? (
                                    <Select value={item.genre} onValueChange={(newGenre) => updateGenre(item.id, newGenre)}>
                                        <SelectTrigger className="w-[120px] h-6 text-xs bg-control-surface border-border">
                                            <SelectValue placeholder="Select genre" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableGenres.map(genre => (
                                                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="relative group">
                                        <span className={`text-xs px-1 py-0.5 rounded cursor-pointer bg-black/10 text-black`}>
                                            {item.genre}
                                        </span>
                                    </div>
                                )}
                                <button onClick={() => toggleGenreEdit(item.id)} className={`text-xs px-1 py-0.5 rounded hover:bg-black/40 text-black`}>
                                    <Edit className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditingProgram({ ...item, type: activeTabId === 'master-epg' ? 'VOD' : item.type })} className="p-1 rounded hover:bg-black/20 text-black">
                                <Settings className="h-4 w-4" />
                            </button>
                            {showStatus && (
                                <>
                                    <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                    {item.status === 'live' && (
                                        <div className="w-2 h-2 bg-pcr-live-glow rounded-full animate-pulse-live"></div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    } 

    const AddBlockDialog = ({ type, onAdd, existingPrograms, programToEdit, onCancel }: { type: 'VOD' | 'Event', onAdd: (item: EPGPreviewItem) => void, existingPrograms: EPGPreviewItem[], programToEdit: EPGPreviewItem | null, onCancel: () => void }) => {
        const [isOpen, setIsOpen] = useState(!!programToEdit);
        const [startTime, setStartTime] = useState(programToEdit?.time.split('T')[1] || '');
        const [endTime, setEndTime] = useState('');
        const [title, setTitle] = useState(programToEdit?.title || '');
        const [genre, setGenre] = useState(programToEdit?.genre || '');
        const [description, setDescription] = useState(programToEdit?.description || '');
        const [studioId, setStudioId] = useState(''); // Assuming studioId is not part of EPGPreviewItem yet
        const [image, setImage] = useState<string | null>(programToEdit?.imageUrl || '/toi_global_poster.png');
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [errors, setErrors] = useState<{ [key: string]: string }>({});

        // Calculate duration from start and end time
        const calculateDuration = () => {
            if (!startTime || !endTime) return 0;
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = timeToMinutes(endTime);
            return endMinutes - startMinutes;
        };

        const duration = calculateDuration();

        // Generate end time options with 15-minute intervals
        const generateEndTimeOptions = () => {
            if (!startTime) return [];
            
            const options = [];
            const startMinutes = timeToMinutes(startTime);
            
            // Generate options for next 8 hours (480 minutes) in 15-minute intervals
            for (let i = 15; i <= 480; i += 15) {
                const endMinutes = startMinutes + i;
                const endTimeStr = minutesToTime(endMinutes);
                const endTimeAMPM = minutesToTimeAMPM(endMinutes);
                const durationMinutes = i;
                
                // Format duration for display
                let durationText = '';
                if (durationMinutes < 60) {
                    durationText = `(${durationMinutes} mins)`;
                } else if (durationMinutes === 60) {
                    durationText = '(1 hr)';
                } else {
                    const hours = Math.floor(durationMinutes / 60);
                    const mins = durationMinutes % 60;
                    durationText = mins > 0 ? `(${hours} hr ${mins} mins)` : `(${hours} hrs)`;
                }
                
                options.push({
                    value: endTimeStr,
                    label: `${endTimeAMPM} ${durationText}`
                });
            }
            
            return options;
        };

        const endTimeOptions = generateEndTimeOptions();

        const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImage(event.target?.result as string);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };

        useEffect(() => {
            if (!programToEdit) {
                let newStartTime = '00:00';
                if (existingPrograms.length > 0) {
                    const lastProgramEndMinutes = existingPrograms.reduce((maxEndTime, program) => {
                        const programEnd = timeToMinutes(program.time.split('T')[1]) + program.duration;
                        return Math.max(maxEndTime, programEnd);
                    }, 0);
                    newStartTime = minutesToTime(lastProgramEndMinutes);
                }
                setStartTime(newStartTime);
                // Set initial end time to 1 hour after start time
                const initialStartMinutes = timeToMinutes(newStartTime);
                setEndTime(minutesToTime(initialStartMinutes + 60));
            } else {
                // For editing, set end time based on program duration
                const startMinutes = timeToMinutes(programToEdit.time.split('T')[1]);
                setEndTime(minutesToTime(startMinutes + programToEdit.duration));
            }
        }, [programToEdit, existingPrograms]);


        
        const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newStartTime = e.target.value;
            setStartTime(newStartTime);
            validateField('startTime', newStartTime);
        };

        const validateField = (name: string, value: string) => {
            let error = '';
            if (!value && name !== 'endTime') {
                error = 'This field is required';
            }
            if (name === 'endTime') {
                if (!value) {
                    error = 'End time is required';
                } else if (duration < 15) {
                    error = 'Minimum duration is 15 minutes';
                } else if (duration > 480) {
                    error = 'Maximum duration is 8 hours';
                }
            }
            setErrors(prev => ({ ...prev, [name]: error }));
            return !error;
        };
    
        const validateSchedule = () => {
            if (!startTime) return true;
    
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = startMinutes + duration;
    
            const conflict = existingPrograms.some(program => {
                const programStart = timeToMinutes(program.time.split('T')[1]);
                const programEnd = programStart + program.duration;
                return (startMinutes < programEnd && endMinutes > programStart);
            });
    
            if (conflict) {
                setErrors(prev => ({ ...prev, time: 'Time slot overlaps with another scheduled program' }));
                return false;
            } else {
                setErrors(prev => ({ ...prev, time: '' }));
                return true;
            }
        };
    
        useEffect(() => {
            validateSchedule();
        }, [startTime, duration, existingPrograms]);
    
        const handleAdd = () => {
            const isStartTimeValid = validateField('startTime', startTime);
            const isEndTimeValid = validateField('endTime', endTime);
            const isTitleValid = validateField('title', title);
            const isGenreValid = validateField('genre', genre);
            const isStudioIdValid = type === 'Event' ? validateField('studioId', studioId) : true;
    
            if (isStartTimeValid && isEndTimeValid && isTitleValid && isGenreValid && isStudioIdValid && validateSchedule()) {
                const newItem: EPGPreviewItem = {
                    ...programToEdit,
                    id: programToEdit ? programToEdit.id : `new-${Date.now()}`,
                    time: `${programToEdit ? programToEdit.time.split('T')[0] : new Date().toISOString().split('T')[0]}T${startTime}`,
                    title,
                    type: type,
                    duration: duration,
                    geoZone: 'Global',
                    description,
                    status: 'scheduled',
                    genre,
                    isEditing: false,
                    imageUrl: image || '/toi_global_poster.png',
                };
                onAdd(newItem);
                if (programToEdit) {
                    onCancel();
                } else {
                    setIsOpen(false);
                }
            }
        };
    
        const isFormValid = !Object.values(errors).some(error => error) && startTime && endTime && title && genre && (type === 'VOD' || studioId);

        const DialogComponent = (
            <DialogContent className="bg-card-dark border-border">
                <DialogHeader>
                    <DialogTitle>{programToEdit ? 'Edit Program' : `Schedule ${type === 'VOD' ? 'Program' : 'Live Program'}`}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" type="time" value={startTime} onChange={handleStartTimeChange} onBlur={(e) => validateField('startTime', e.target.value)} className="bg-control-surface border-border" />
                            {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
                        </div>
                        <div>
                            <Label htmlFor="endTime">End Time</Label>
                            <Select value={endTime} onValueChange={(value) => { setEndTime(value); validateField('endTime', value); }}>
                                <SelectTrigger className="bg-control-surface border-border">
                                    <SelectValue placeholder="Select end time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {endTimeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
                        </div>
                    </div>
                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                    <div>
                        <Label htmlFor="title">Program Title</Label>
                        <Input id="title" value={title} onChange={(e) => { setTitle(e.target.value); validateField('title', e.target.value); }} onBlur={(e) => validateField('title', e.target.value)} className="bg-control-surface border-border" />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    {type === 'Event' && (
                        <div>
                            <Label htmlFor="studioId">Studio ID</Label>
                            <Select onValueChange={(value) => { setStudioId(value); validateField('studioId', value); }} value={studioId}>
                                <SelectTrigger className="bg-control-surface border-border">
                                    <SelectValue placeholder="Select Studio ID" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cleo 1">Cleo 1</SelectItem>
                                    <SelectItem value="Cleo 2">Cleo 2</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.studioId && <p className="text-red-500 text-xs mt-1">{errors.studioId}</p>}
                        </div>
                    )}
                    <div>
                        <Label htmlFor="genre">Genre</Label>
                        <Select onValueChange={(value) => { setGenre(value); validateField('genre', value); }} value={genre}>
                            <SelectTrigger className="bg-control-surface border-border">
                                <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableGenres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {errors.genre && <p className="text-red-500 text-xs mt-1">{errors.genre}</p>}
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-control-surface border-border" />
                    </div>
                    <div>
                        <Label>Program Image</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="w-32 h-18 overflow-hidden rounded-md">
                                <img src={image || '/toi_global_poster.png'} alt="Program" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    Upload Image
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                 <Button type="button" variant="ghost" size="sm" onClick={() => { setImage('/toi_global_poster.png'); setHasUnsavedChanges(true); }}>
                                    Reset to default
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => programToEdit ? onCancel() : setIsOpen(false)}>Cancel</Button>
                    <Button variant="broadcast" onClick={handleAdd} disabled={!isFormValid}>{programToEdit ? 'Save Changes' : 'Add to Schedule'}</Button>
                </div>
            </DialogContent>
        );

        if (programToEdit) {
            return DialogComponent;
        }

        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant={type === 'Event' ? 'live' : 'playlist'} size="sm" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        {type === 'VOD' ? 'Program' : 'Live Program'}
                    </Button>
                </DialogTrigger>
                {DialogComponent}
            </Dialog>
        );
    };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
        return new Date(`1970-01-01T${hours}:${minutes}:00`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRange = (startTime: string, duration: number) => {
    const startFormatted = formatTime(startTime);
    const endMinutes = timeToMinutes(startTime) + duration;
    const endTime = minutesToTime(endMinutes);
    const endFormatted = formatTime(endTime);
    return `${startFormatted} - ${endFormatted}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-pcr-live text-white';
      case 'scheduled': return 'bg-status-scheduled text-black';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
        return type === 'Event' ? 'bg-pcr-live text-white' : 'bg-mcr-playlist text-white';
    };

    const generatePreview = (format: string) => {
        const programs = mockEPGData.map(item => ({
            "Channel Name": "TOI Global",
            "MRP": "0",
            "Schedule Airing Date": item.time.split('T')[0],
            "Airing Start Time": item.time.split('T')[1],
            "End Time": minutesToTime(timeToMinutes(item.time.split('T')[1]) + item.duration),
            "Program Duration": item.duration,
            "Genre": item.genre,
            "Sub Genre": "",
            "Program Name": item.title,
            "Original/Repeat Live/Recorded": item.status === 'live' ? 'Live' : 'Recorded',
            "Broadcast Language": "English",
            "Dubbed Language": "",
            "Episode Number": "",
            "Episode Title": "",
            "Season Number": "",
            "Season Name": "",
            "Star Cast (Comma separated value)": "",
            "Director (Comma separated value)": "",
            "Producer (Comma separated value)": "",
            "Year of Release": new Date().getFullYear(),
            "Censor/Broadcast Ratings": "U/A",
            "Generic Synopsis": item.description,
            "Episodic Synopsis": "",
            "Image URL": item.imageUrl || ""
        }));

        if (format === 'json') {
            return JSON.stringify(programs, null, 2);
        } else if (format === 'xml') {
            let xml = `<?xml version="1.0" encoding="UTF-8"?>
<programs>
`;
            programs.forEach(p => {
                xml += `  <program>
`;
                Object.entries(p).forEach(([key, value]) => {
                    const tagName = key.replace(/[^a-zA-Z0-9]/g, '');
                    xml += `    <${tagName}>${value}</${tagName}>
`;
                });
                xml += `  </program>
`;
            });
            xml += '</programs>';
            return xml;
        }
        return '';
    };

    const handleQuickXlsDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(mockEPGData.map(item => ({
            "Channel Name": "TOI Global",
            "MRP": "0",
            "Schedule Airing Date": item.time.split('T')[0],
            "Airing Start Time": item.time.split('T')[1],
            "End Time": minutesToTime(timeToMinutes(item.time.split('T')[1]) + item.duration),
            "Program Duration": item.duration,
            "Genre": item.genre,
            "Sub Genre": "",
            "Program Name": item.title,
            "Original/Repeat Live/Recorded": item.status === 'live' ? 'Live' : 'Recorded',
            "Broadcast Language": "English",
            "Dubbed Language": "",
            "Episode Number": "",
            "Episode Title": "",
            "Season Number": "",
            "Season Name": "",
            "Star Cast (Comma separated value)": "",
            "Director (Comma separated value)": "",
            "Producer (Comma separated value)": "",
            "Year of Release": new Date().getFullYear(),
            "Censor/Broadcast Ratings": "U/A",
            "Generic Synopsis": item.description,
            "Episodic Synopsis": "",
            "Image URL": item.imageUrl || ""
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "EPG");
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        XLSX.writeFile(workbook, `epg_preview_${today}.xls`);
        toast({ title: "XLS file downloaded successfully." });
    };

    const handleDownload = (format: 'json' | 'xml' | 'xls') => {
        let data: string | undefined;
        let blobType: string;
        let fileName: string;

        switch (format) {
            case 'json':
                data = generatePreview('json');
                blobType = 'application/json;charset=utf-8;';
                fileName = 'EPG.json';
                break;
            case 'xml':
                data = generatePreview('xml');
                blobType = 'application/xml;charset=utf-8;';
                fileName = 'EPG.xml';
                break;
            case 'xls':
                handleQuickXlsDownload();
                return;
        }

        if (data) {
            const blob = new Blob([data], { type: blobType });
            saveAs(blob, fileName);
            toast({ title: `${format.toUpperCase()} file downloaded successfully.` });
        }
    };

    const generateXlsPreview = () => {
        const data = mockEPGData.slice(0, 5).map(item => ({
            "Channel Name": "TOI Global",
            "MRP": "0",
            "Schedule Airing Date": item.time.split('T')[0],
            "Airing Start Time": item.time.split('T')[1],
            "End Time": minutesToTime(timeToMinutes(item.time.split('T')[1]) + item.duration),
            "Program Duration": item.duration,
            "Genre": item.genre,
            "Sub Genre": "",
            "Program Name": item.title,
            "Original/Repeat Live/Recorded": item.status === 'live' ? 'Live' : 'Recorded',
            "Broadcast Language": "English",
            "Dubbed Language": "",
            "Episode Number": "",
            "Episode Title": "",
            "Season Number": "",
            "Season Name": "",
            "Star Cast (Comma separated value)": "",
            "Director (Comma separated value)": "",
            "Producer (Comma separated value)": "",
            "Year of Release": new Date().getFullYear(),
            "Censor/Broadcast Ratings": "U/A",
            "Generic Synopsis": item.description,
            "Episodic Synopsis": "",
            "Image URL": item.imageUrl || ""
        }));

        if (data.length === 0) {
            return <p>No data to display.</p>;
        }

        const headers = Object.keys(data[0]);

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-700">
                            {headers.map(header => <th key={header} className="p-1 font-bold text-white">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="border-b border-gray-600">
                                {headers.map(header => <td key={header} className="p-1">{row[header as keyof typeof row]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
  };
    // removed duplicate handleDateChangeFromCalendar

    const renderCurrentView = () => {
        const dailyPrograms = selectedDayPrograms;

        // Determine the view based on activeTabId
        if (activeTabId === 'master-epg') {
            return (
                <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                    <CardContent>
                        <div className="bg-control-surface rounded-lg p-4">
                            <div className="space-y-3">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                     <SortableContext items={todayPrograms.map(item => item.id)} strategy={verticalListSortingStrategy}>
                                         {todayPrograms.map((item) => (
                                            <SortableItem key={item.id} id={item.id}>
                                                {(listeners) => (
                                                    <ProgramItem item={item} isDraggable={true} listeners={listeners} showStatus={false} />
                                                )}
                                            </SortableItem>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (activeTabId === 'select-date') {
            // Check if a date has been selected
            if (selectDateTabLabel === 'Select Date') {
                // No date selected yet - show default message
                return (
                    <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                        <CardContent>
                            <div className="bg-control-surface rounded-lg p-8">
                                <div className="text-center space-y-4">
                                    {/* Calendar Icon */}
                                    <div className="flex justify-center mb-6">
                                        <div className="w-16 h-16 bg-broadcast-blue/10 rounded-full flex items-center justify-center">
                                            <CalendarIcon className="h-8 w-8 text-broadcast-blue" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        Kindly select a date
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Click on the "Select Date" tab above to choose a date and view the EPG preview
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            }
            
            // Date has been selected, check if there are programs for that date
            if (dailyPrograms.length === 0) {
                return (
                    <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                        <CardContent>
                            <div className="bg-control-surface rounded-lg p-8">
                                <div className="text-center space-y-4">
                                    {/* Custom Calendar Icon */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative w-16 h-20 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
                                            {/* Calendar Header */}
                                            <div className="bg-broadcast-blue text-white text-center py-1 px-2">
                                                <div className="text-xs font-medium">
                                                    {selectedDate.toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                            </div>
                                            {/* Calendar Body */}
                                            <div className="flex items-center justify-center h-12 bg-white">
                                                <div className="text-2xl font-bold text-gray-800">
                                                    {selectedDate.getDate()}
                                                </div>
                                            </div>
                                            {/* Calendar Footer */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100"></div>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        No EPG has been created for this date
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Please open Master EPG and create the schedule.
                                    </p>
                                    <Button 
                                        variant="broadcast" 
                                     onClick={() => { handleTabChange('master-epg'); setHasUnsavedChanges(false); }}
                                        className="mt-4"
                                    >
                                        Open Master EPG
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            }

            return (
                <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                    <CardContent>
                        <div className="bg-control-surface rounded-lg p-4">
                            <div className="space-y-3">
                                {dailyPrograms.filter(i => i.status === 'completed').map((item) => (
                                    <ProgramItem key={item.id} item={item} isDraggable={false} />
                                ))}
                                {dailyPrograms.find(i => i.status === 'live') && (
                                    <ProgramItem item={dailyPrograms.find(i => i.status === 'live')!} isDraggable={false} />
                                )}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={dailyPrograms.filter(i => i.status === 'scheduled').map(item => item.id)} strategy={verticalListSortingStrategy}>
                                        {dailyPrograms.filter(i => i.status === 'scheduled').map((item) => (
                                            <SortableItem key={item.id} id={item.id}>
                                                {(listeners) => (
                                                    <ProgramItem item={item} isDraggable={true} listeners={listeners} />
                                                )}
                                            </SortableItem>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (activeTabId === 'todays-epg' || activeTabId.startsWith('date-')) {
            // Check if there are no programs for the selected date
            if (dailyPrograms.length === 0) {
                return (
                    <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                        <CardContent>
                            <div className="bg-control-surface rounded-lg p-8">
                                <div className="text-center space-y-4">
                                    {/* Custom Calendar Icon */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative w-16 h-20 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
                                            {/* Calendar Header */}
                                            <div className="bg-broadcast-blue text-white text-center py-1 px-2">
                                                <div className="text-xs font-medium">
                                                    {selectedDate.toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                            </div>
                                            {/* Calendar Body */}
                                            <div className="flex items-center justify-center h-12 bg-white">
                                                <div className="text-2xl font-bold text-black">
                                                    {selectedDate.getDate()}
                                                </div>
                                            </div>
                                            {/* Calendar Footer */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100"></div>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        No EPG has been created for this date
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Please open Master EPG and create the schedule.
                                    </p>
                                    <Button 
                                        variant="broadcast" 
                                        onClick={() => handleTabChange('master-epg')}
                                        className="mt-4"
                                    >
                                        Open Master EPG
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            }

            return (
                <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                    <CardContent>
                        <div className="bg-control-surface rounded-lg p-4">
                            <div className="space-y-3">
                                {dailyPrograms.filter(i => i.status === 'completed').map((item) => (
                                    <ProgramItem key={item.id} item={item} isDraggable={false} />
                                ))}
                                {dailyPrograms.find(i => i.status === 'live') && (
                                    <ProgramItem item={dailyPrograms.find(i => i.status === 'live')!} isDraggable={false} />
                                )}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={dailyPrograms.filter(i => i.status === 'scheduled').map(item => item.id)} strategy={verticalListSortingStrategy}>
                                        {dailyPrograms.filter(i => i.status === 'scheduled').map((item) => (
                                            <SortableItem key={item.id} id={item.id}>
                                                {(listeners) => (
                                                    <ProgramItem item={item} isDraggable={true} listeners={listeners} />
                                                )}
                                            </SortableItem>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (activeTabId === 'weekly-epg') {
            return (
                <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                    <CardContent className="p-6">
                        <WeeklyView
                            programs={mockEPGData}
                            onProgramCopy={(program, newDate) => {
                                const newTime = program.time.split('T')[1];
                                const newProgram = {
                                    ...program,
                                    id: `copy-${program.id}-${Date.now()}`,
                                    time: `${newDate}T${newTime}`,
                                };
                                setMockEPGData(prev => [...prev, newProgram]);
                                toast({ title: `Program copied to ${newDate} successfully` });
                            }}
                            onProgramEdit={(program) => setEditingProgram(program)}
                            onDateClick={handleDateChangeFromCalendar}
                        />
                    </CardContent>
                </Card>
            );
        }

        if (activeTabId === 'monthly-epg') {
            return (
                <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
                    <CardContent className="p-6">
                        <MonthlyView programs={mockEPGData} onDateClick={handleDateChangeFromCalendar} />
                    </CardContent>
                </Card>
            );
        }

        return null;
    }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">

      {/* Main Layout - Tab Interface and RHS Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side - Tab Interface and EPG Content */}
        <div className="lg:col-span-3">
          {/* Draft Banner */}
          {isDraftMode && (
            <div className="mb-3 p-3 border border-border bg-yellow-50 text-yellow-800 rounded flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                Add programs for your new channel ‘{draftChannel?.name}’ to complete setup.
              </div>
            </div>
          )}
          {/* Tab Interface */}
          <div className="mb-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    data-tab-id={tab.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-colors ${
                      activeTabId === tab.id
                        ? 'bg-broadcast-blue text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <span className="text-sm font-medium">{tab.label}</span>
                    {tab.id === 'select-date' && (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                ))}
              </div>
              {/* Save EPG Button - Extreme right with validations */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="control" size="sm" onClick={handleSaveEpg} disabled={isSaving || !isSaveEpgEnabled()} className="shrink-0">
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        Save EPG
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {(!isSaveEpgEnabled() && getSaveEpgTooltipMessage()) && (
                    <TooltipContent>
                      <p>{getSaveEpgTooltipMessage()}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Calendar Dropdown for Select Date Tab */}
          {activeTabId === 'select-date' && isSelectDateCalendarOpen && (
            <div className="relative">
              <div className="calendar-dropdown absolute top-2 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg border border-gray-200 shadow-lg p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      // Update the "Select Date" tab label with the selected date
                      const dateLabel = date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      setSelectDateTabLabel(dateLabel);
                      setSelectedDate(date);
                      setActiveTabId('select-date');
                      // Close the dropdown after date selection
                      setIsSelectDateCalendarOpen(false);
                    }
                  }}
                  className="rounded-md border"
                  classNames={{
                    day_selected: "bg-broadcast-blue text-white hover:bg-broadcast-blue hover:text-white",
                    day_today: "bg-slate-600 text-white",
                  }}
                />
              </div>
            </div>
          )}

          {/* EPG Content - Fixed Height and Scrollable */}
          <div className="h-[calc(100vh-100px)] overflow-y-auto">
            {renderCurrentView()}
          </div>
        </div>
        
        {/* RHS Sidebar - Takes 1 column, starts from top */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
              <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AddBlockDialog type="VOD" onAdd={handleSaveProgram} existingPrograms={mockEPGData} programToEdit={null} onCancel={() => {}} />
              <Button variant="control" size="sm" className="w-full justify-start" onClick={() => setIsRepeatModalOpen(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy EPG
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start" onClick={() => setIsManageAdsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Manage Ads
              </Button>
            </CardContent>
          </Card>

          {/* Export Settings Card */}
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="format">Output Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="bg-control-surface border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xmltv">XMLTV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="api">API Endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                                <Label htmlFor="distributor">Distributor</Label>
                                <Select value={distributor} onValueChange={setDistributor}>
                  <SelectTrigger className="bg-control-surface border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                                        <SelectItem value="Gracenote">Gracenote</SelectItem>
                                        <SelectItem value="Amagi">Amagi</SelectItem>
                                        <SelectItem value="Samsung">Samsung</SelectItem>
                                        <SelectItem value="Xiaomi">Xiaomi</SelectItem>
                                        <SelectItem value="LG">LG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                                <Switch id="metadata" checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
                <Label htmlFor="metadata">Include Metadata</Label>
              </div>

              <div className="space-y-2">
                <Button variant="broadcast" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export EPG Data
                </Button>
                <Button variant="control" className="w-full" onClick={() => setIsPreviewModalOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview EPG
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="control" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Send to CDN
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Update OTT Platform
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start">
                <Code className="h-4 w-4 mr-2" />
                Webhook Notify
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
{isPreviewModalOpen && (
    <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-[80vw] max-h-[85vh] h-full flex flex-col">
            <DialogHeader>
                <DialogTitle>EPG Preview</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
                <Tabs defaultValue="json" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="json" className="bg-white text-black data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">JSON</TabsTrigger>
                        <TabsTrigger value="xml" className="bg-white text-black data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">XML</TabsTrigger>
                        <TabsTrigger value="xls" className="bg-white text-black data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">XLS</TabsTrigger>
                    </TabsList>
                    <TabsContent value="json" className="flex-grow overflow-auto">
                        <pre className="text-xs text-green-400 font-mono bg-black/50 rounded-lg p-3 h-full">
                            {generatePreview('json')}
                        </pre>
                    </TabsContent>
                    <TabsContent value="xml" className="flex-grow overflow-auto">
                        <pre className="text-xs text-green-400 font-mono bg-black/50 rounded-lg p-3 h-full">
                            {generatePreview('xml')}
                        </pre>
                    </TabsContent>
                    <TabsContent value="xls" className="flex-grow overflow-auto">
                        {generateXlsPreview()}
                    </TabsContent>
                </Tabs>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
                <Button variant="outline" onClick={() => handleDownload('json')}>Download JSON</Button>
                <Button variant="outline" onClick={() => handleDownload('xml')}>Download XML</Button>
                <Button variant="outline" onClick={() => handleDownload('xls')}>Download XLS</Button>
            </div>
        </DialogContent>
    </Dialog>
)}
            {editingProgram && (
                <Dialog open={!!editingProgram} onOpenChange={() => setEditingProgram(null)}>
                    <AddBlockDialog 
                        type={editingProgram.type}
                        programToEdit={editingProgram}
                        onAdd={handleSaveProgram}
                        existingPrograms={mockEPGData.filter(p => p.id !== editingProgram.id)}
                        onCancel={() => setEditingProgram(null)}
                    />
                </Dialog>
            )}
            <ManageAdsModal
                isOpen={isManageAdsModalOpen}
                onClose={() => setIsManageAdsModalOpen(false)}
                onSave={handleAdSave}
            />
            <RepeatScheduleModal
                isOpen={isRepeatModalOpen}
                onClose={() => setIsRepeatModalOpen(false)}
                onSave={handleRepeatSave}
            />
            <Toaster />
    </div>
  );
};
