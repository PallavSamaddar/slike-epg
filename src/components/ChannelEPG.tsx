import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, Code, Database, Settings, RefreshCw, Plus, Copy, Edit, GripVertical, ClipboardCopy, FileDown, ChevronDown, Check, Eye, AlertTriangle } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
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
  playlist?: string;
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
        { id: `d-${idOffset + 1}`, time: `${dateString}T09:00`, title: 'Morning Show', type: 'Event', duration: 120, geoZone: 'Global', description: 'A morning talk show.', status: 'scheduled', genre: 'Talk Show', playlist: 'Default Playlist', imageUrl: getRandomPoster() },
        { id: `d-${idOffset + 2}`, time: `${dateString}T11:00`, title: 'Cartoon Fun', type: 'VOD', duration: 60, geoZone: 'Global', description: 'Animated series for kids.', status: 'scheduled', genre: 'Kids', playlist: 'Default Playlist', imageUrl: getRandomPoster() },
        { id: `d-${idOffset + 3}`, time: `${dateString}T15:00`, title: 'Indie Films', type: 'VOD', duration: 180, geoZone: 'US/EU', description: 'A selection of independent movies.', status: 'scheduled', genre: 'Movies', playlist: 'Tech Reviews', imageUrl: getRandomPoster() },
        { id: `d-${idOffset + 4}`, time: `${dateString}T20:00`, title: 'Rock Anthems', type: 'VOD', duration: 60, geoZone: 'Global', description: 'Classic rock music videos.', status: 'scheduled', genre: 'Music', playlist: 'Music Mix', imageUrl: getRandomPoster() },
    ];
};

type ViewMode = 'daily' | 'weekly' | 'monthly';

export const ChannelEPG = ({ onNavigate }: { onNavigate?: (view: string) => void }) => {
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
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
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

  // Update calendar position on scroll or resize
  useEffect(() => {
    const updatePosition = () => {
      if (isSelectDateCalendarOpen) {
        const tabElement = document.querySelector('[data-tab-id="select-date"]');
        if (tabElement) {
          const rect = tabElement.getBoundingClientRect();
          setCalendarPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX
          });
        }
      }
    };

    if (isSelectDateCalendarOpen) {
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
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
        if (!isSelectDateCalendarOpen) {
          // Calculate position when opening
          setTimeout(() => {
            const tabElement = document.querySelector('[data-tab-id="select-date"]');
            if (tabElement) {
              const rect = tabElement.getBoundingClientRect();
              setCalendarPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
              });
            }
          }, 0);
        }
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
    const playlists = ['Default Playlist','Sports Highlights','Music Mix','Tech Reviews'];
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
      const playlist = playlists[hour % playlists.length];
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
        playlist,
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
      setIsManageAdsModalOpen(false);
  };

  const handleRepeatSave = (startDate: string, endDate: string, selectedDays: number[]) => {
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

  // Continue with the rest of the component...
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <PageHeader 
            title={`${(typeof window !== 'undefined' && localStorage.getItem('activeChannelName')) || 'TOI Global'} - Channel EPG`} 
            fullWidth 
            rightContent={
              <div className="flex items-center gap-2">
                {/* Add Program Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                  onClick={() =>
                    setEditingProgram({
                      id: `new-${Date.now()}`,
                      time: `${new Date().toISOString().split("T")[0]}T12:00`,
                      title: "",
                      type: "VOD",
                      duration: 60,
                      geoZone: "Global",
                      status: "scheduled",
                      genre: "",
                      playlist: "Default Playlist",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>

                {/* Export Settings Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>

                {/* Generate 14 days EPG Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveEpg}
                          disabled={isSaving || !isSaveEpgEnabled()}
                          className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                        >
                          {isSaving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Database className="h-4 w-4 mr-2" />
                          )}
                          Generate 14 days EPG
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isSaveEpgEnabled() && getSaveEpgTooltipMessage() && (
                      <TooltipContent>
                        <p>{getSaveEpgTooltipMessage()}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          />
          <div className="mb-2 border-b border-gray-200 relative">
            <div className="flex items-center justify-between">
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
            </div>
            
            {/* Calendar Dropdown for Date Selection */}
            {isSelectDateCalendarOpen && createPortal(
              <div 
                className="fixed z-[9999] p-3 bg-white rounded-lg border border-gray-200 shadow-lg calendar-dropdown w-80" 
                style={{ 
                  pointerEvents: 'auto',
                  top: `${calendarPosition.top}px`,
                  left: `${calendarPosition.left}px`
                }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setIsSelectDateCalendarOpen(false);
                    }
                  }}
                  className="rounded-md border"
                  classNames={{
                    day_selected:
                      "bg-broadcast-blue text-white hover:bg-broadcast-blue hover:text-white",
                    day_today: "bg-slate-600 text-white",
                  }}
                />
              </div>,
              document.body
            )}
          </div>
          <div className="h-[calc(100vh-100px)] overflow-y-auto">
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
                                      <div className="p-3 rounded bg-background border border-border flex items-start gap-4">
                                        <div className="flex-shrink-0 w-40 text-center">
                                          <div className="w-40 h-24 overflow-hidden rounded-sm">
                                            <img loading="lazy" src={item.imageUrl || '/toi_global_poster.png'} alt={item.title} className="w-full h-full object-cover" />
                                          </div>
                                          <span className="text-xs font-mono text-broadcast-blue mt-1">
                                            {item.time.split('T')[1]} - {minutesToTime(timeToMinutes(item.time.split('T')[1]) + item.duration)}
                                          </span>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <GripVertical className="cursor-grab" {...listeners} />
                                              <span className="font-medium text-sm truncate text-black">
                                                {item.title}
                                              </span>
                                              <Badge className="bg-mcr-playlist text-white">{item.type}</Badge>
                                              <Badge className="bg-status-scheduled text-black">{item.status}</Badge>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <div>
                                              <p className="text-sm text-muted-foreground">{item.description}</p>
                                              <p className="text-xs text-muted-foreground mt-1">
                                                Playlist: {item.playlist || 'Default Playlist'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                  )}
                              </SortableItem>
                          ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-card-dark border-border w-full">
            <CardContent className="pt-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg group">
                <img 
                  src="/toi_global_poster.png" 
                  alt="Channel Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors duration-200">
                    <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5"></div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="control" size="sm" className="w-full justify-start" onClick={() => onNavigate?.('playlists')}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Playlist
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start" onClick={() => setIsRepeatModalOpen(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy EPG
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start" onClick={() => onNavigate?.('scheduler')}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Channel Detail
              </Button>
            </CardContent>
          </Card>

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
                <Button variant="control" className="w-full" onClick={() => toast({ title: 'EPG FTP updated successfully' })}>
                  Export to FTP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
