import { useState, useRef, useEffect, FC } from 'react';
import { Download, FileText, Code, Database, Eye, Settings, RefreshCw, Plus, Calendar, Copy, Edit, X, GripVertical, ClipboardCopy, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const SortableItem = ({ id, children }: { id: string, children: (listeners: any) => React.ReactNode }) => {
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

const generateDummyProgramsForDate = (date: Date, idOffset: number): EPGPreviewItem[] => {
    const dateString = date.toISOString().split('T')[0];
    return [
        { id: `d-${idOffset + 1}`, time: `${dateString}T09:00`, title: 'Morning Show', type: 'Event', duration: 120, geoZone: 'Global', description: 'A morning talk show.', status: 'scheduled', genre: 'Talk Show', imageUrl: '/toi_global_poster.png' },
        { id: `d-${idOffset + 2}`, time: `${dateString}T11:00`, title: 'Cartoon Fun', type: 'VOD', duration: 60, geoZone: 'Global', description: 'Animated series for kids.', status: 'scheduled', genre: 'Kids', imageUrl: '/toi_global_poster.png' },
        { id: `d-${idOffset + 3}`, time: `${dateString}T15:00`, title: 'Indie Films', type: 'VOD', duration: 180, geoZone: 'US/EU', description: 'A selection of independent movies.', status: 'scheduled', genre: 'Movies', imageUrl: '/toi_global_poster.png' },
        { id: `d-${idOffset + 4}`, time: `${dateString}T20:00`, title: 'Rock Anthems', type: 'VOD', duration: 60, geoZone: 'Global', description: 'Classic rock music videos.', status: 'scheduled', genre: 'Music', imageUrl: '/toi_global_poster.png' },
    ];
};

export const EPGPreview = () => {
  const [selectedFormat, setSelectedFormat] = useState('xmltv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [distributor, setDistributor] = useState('Gracenote');
  const [previewMode, setPreviewMode] = useState<'viewer' | 'affiliate' | 'api'>('viewer');
  const [isManageAdsModalOpen, setIsManageAdsModalOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [editingGenres, setEditingGenres] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [mockEPGData, setMockEPGData] = useState<EPGPreviewItem[]>(() => {
    const today = new Date();
    const initialPrograms: EPGPreviewItem[] = [
      { id: '1', time: `${today.toISOString().split('T')[0]}T08:00`, title: 'Morning News Live', type: 'Event', duration: 90, geoZone: 'Global', description: 'Live morning news broadcast with breaking news updates', status: 'completed', genre: 'News', imageUrl: '/toi_global_poster.png' },
      { id: '2', time: `${today.toISOString().split('T')[0]}T09:30`, title: 'Weather Update', type: 'Event', duration: 15, geoZone: 'Global', description: 'Local and national weather forecast', status: 'completed', genre: 'News', imageUrl: '/toi_global_poster.png' },
      { id: '3', time: `${today.toISOString().split('T')[0]}T09:45`, title: 'Classic Movies Marathon', type: 'VOD', duration: 135, geoZone: 'US/EU', description: 'Curated selection of classic Hollywood films', status: 'completed', genre: 'Movies', imageUrl: '/toi_global_poster.png' },
      { id: '4', time: `${today.toISOString().split('T')[0]}T12:00`, title: 'Sports Center Live', type: 'Event', duration: 60, geoZone: 'Global', description: 'Live sports news and highlights', status: 'live', genre: 'Sports', imageUrl: '/toi_global_poster.png' },
      { id: '5', time: `${today.toISOString().split('T')[0]}T13:00`, title: 'Afternoon Talk Show', type: 'Event', duration: 60, geoZone: 'Global', description: 'Talk show with celebrity guests.', status: 'scheduled', genre: 'Talk Show', imageUrl: '/toi_global_poster.png' },
      { id: '6', time: `${today.toISOString().split('T')[0]}T14:00`, title: 'Daily Quiz', type: 'VOD', duration: 30, geoZone: 'Global', description: 'An interactive quiz show.', status: 'scheduled', genre: 'Games', imageUrl: '/toi_global_poster.png' },
      { id: '7', time: `${today.toISOString().split('T')[0]}T14:30`, title: 'Cooking with Chefs', type: 'VOD', duration: 45, geoZone: 'Global', description: 'Learn new recipes from world-renowned chefs.', status: 'scheduled', genre: 'Cooking', imageUrl: '/toi_global_poster.png' },
      { id: '8', time: `${today.toISOString().split('T')[0]}T15:15`, title: 'Financial News', type: 'Event', duration: 45, geoZone: 'Global', description: 'Latest updates from the world of finance.', status: 'scheduled', genre: 'News', imageUrl: '/toi_global_poster.png' },
      { id: '9', time: `${today.toISOString().split('T')[0]}T16:00`, title: 'Evening Movie', type: 'VOD', duration: 120, geoZone: 'US/EU', description: 'A blockbuster movie to end your day.', status: 'scheduled', genre: 'Movies', imageUrl: '/toi_global_poster.png' },
      { id: '10', time: `${today.toISOString().split('T')[0]}T18:00`, title: 'Music Hour', type: 'VOD', duration: 60, geoZone: 'Global', description: 'A selection of popular music videos.', status: 'scheduled', genre: 'Music', imageUrl: '/toi_global_poster.png' },
      { id: '11', time: `${today.toISOString().split('T')[0]}T19:00`, title: 'World News Tonight', type: 'Event', duration: 60, geoZone: 'Global', description: 'Comprehensive coverage of world events.', status: 'scheduled', genre: 'News', imageUrl: '/toi_global_poster.png' },
      { id: '12', time: `${today.toISOString().split('T')[0]}T20:00`, title: 'Late Night Comedy', type: 'VOD', duration: 60, geoZone: 'Global', description: 'A roundup of the best comedy sketches.', status: 'scheduled', genre: 'Comedy', imageUrl: '/toi_global_poster.png' }
    ];

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
  
    const handleAdSave = (adConfig: any) => {
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

                // Prevent dropping items at or before the live program
                if (liveItemIndex !== -1 && newIndex <= liveItemIndex) {
                    toast({
                        title: "Action Restricted",
                        description: "Cannot move items above the live program.",
                        variant: "destructive",
                    });
                    return items;
                }

                return arrayMove(items, oldIndex, newIndex);
            });
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

    const availableGenres = ['Movies', 'Classic', 'Games', 'Fun', 'Sports', 'News', 'Entertainment', 'Documentary', 'Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Family', 'Kids', 'Weather', 'Talk Show', 'Quiz', 'Lifestyle', 'Finance', 'Music', 'World', 'Cooking'];

    const toggleEditMode = (id: string) => {
        setMockEPGData(prev => prev.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : { ...item, isEditing: false }));
    };

    const toggleGenreEdit = (id: string) => {
        setEditingGenres(editingGenres === id ? null : id);
    };

    const updateGenre = (id: string, newGenre: string) => {
        setMockEPGData(prev => prev.map(item => item.id === id ? { ...item, genre: newGenre } : item));
        setEditingGenres(null);
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
    };

    const ProgramItem = ({ item, isDraggable, listeners }: { item: EPGPreviewItem, isDraggable: boolean, listeners?: any }) => {
        return (
            <div className="p-3 rounded bg-background border border-border flex items-start gap-4">
                <img src={item.imageUrl || '/toi_global_poster.png'} alt={item.title} className="w-16 h-16 object-cover rounded-sm flex-shrink-0" />
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isDraggable && <GripVertical className="cursor-grab" {...listeners} />}
                            {item.isEditing ? (
                                <Input
                                    value={item.title}
                                    onChange={(e) => setMockEPGData(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i))}
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
                            <button onClick={() => setEditingProgram(item)} className="p-1 rounded hover:bg-black/20 text-black">
                                <Settings className="h-4 w-4" />
                            </button>
                            <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            {item.status === 'live' && (
                                <div className="w-2 h-2 bg-pcr-live-glow rounded-full animate-pulse-live"></div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-mono text-broadcast-blue w-16">
                            {formatTime(item.time.split('T')[1])}
                        </div>
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
        const [endTime, setEndTime] = useState(programToEdit ? minutesToTime(timeToMinutes(programToEdit.time.split('T')[1]) + programToEdit.duration) : '');
        const [title, setTitle] = useState(programToEdit?.title || '');
        const [genre, setGenre] = useState(programToEdit?.genre || '');
        const [description, setDescription] = useState(programToEdit?.description || '');
        const [studioId, setStudioId] = useState(''); // Assuming studioId is not part of EPGPreviewItem yet
        const [image, setImage] = useState<string | null>(programToEdit?.imageUrl || '/toi_global_poster.png');
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [errors, setErrors] = useState<{ [key: string]: string }>({});
        const [isEndTimeManuallySet, setIsEndTimeManuallySet] = useState(!!programToEdit);

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
                if (existingPrograms.length > 0) {
                    const lastProgramEndMinutes = existingPrograms.reduce((maxEndTime, program) => {
                        const programEnd = timeToMinutes(program.time.split('T')[1]) + program.duration;
                        return Math.max(maxEndTime, programEnd);
                    }, 0);
                    setStartTime(minutesToTime(lastProgramEndMinutes));
                } else {
                    setStartTime('00:00');
                }
            }
        }, [programToEdit, existingPrograms]);

        useEffect(() => {
            if (startTime && !isEndTimeManuallySet) {
                const startMinutes = timeToMinutes(startTime);
                setEndTime(minutesToTime(startMinutes + 120));
            }
        }, [startTime, isEndTimeManuallySet]);
        
        const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newStartTime = e.target.value;
            setStartTime(newStartTime);
            validateField('startTime', newStartTime);
        };
    
        const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setIsEndTimeManuallySet(true);
            const newEndTime = e.target.value;
            setEndTime(newEndTime);
            validateField('endTime', newEndTime);
    
            if (startTime && newEndTime) {
                const startMinutes = timeToMinutes(startTime);
                const endMinutes = timeToMinutes(newEndTime);
                if (endMinutes <= startMinutes) {
                    setStartTime(minutesToTime(endMinutes - 30));
                }
            }
        };

        const validateField = (name: string, value: string) => {
            let error = '';
            if (!value) {
                error = 'This field is required';
            }
            setErrors(prev => ({ ...prev, [name]: error }));
            return !error;
        };
    
        const validateSchedule = () => {
            if (!startTime || !endTime) return true;
    
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = timeToMinutes(endTime);
    
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
        }, [startTime, endTime, existingPrograms]);
    
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
                    duration: timeToMinutes(endTime) - timeToMinutes(startTime),
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
                    <DialogTitle>{programToEdit ? 'Edit' : 'Schedule'} {type === 'VOD' ? 'Recorded' : 'Live'} Program</DialogTitle>
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
                            <Input id="endTime" type="time" value={endTime} onChange={handleEndTimeChange} onBlur={(e) => validateField('endTime', e.target.value)} className="bg-control-surface border-border" />
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
                            <img src={image || '/toi_global_poster.png'} alt="Program" className="w-20 h-20 object-cover rounded" />
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
                                <Button type="button" variant="ghost" size="sm" onClick={() => setImage('/toi_global_poster.png')}>
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
                    <Button variant={type === 'Event' ? 'live' : 'playlist'} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {type === 'VOD' ? 'Recorded Program' : 'Live Program'}
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
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<programs>\n';
            programs.forEach(p => {
                xml += '  <program>\n';
                Object.entries(p).forEach(([key, value]) => {
                    const tagName = key.replace(/[^a-zA-Z0-9]/g, '');
                    xml += `    <${tagName}>${value}</${tagName}>\n`;
                });
                xml += '  </program>\n';
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

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">TOI Global EPG Preview</h1>
                    <p className="text-muted-foreground">Preview your EPG and export in multiple formats</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="control">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                    </Button>
                    <AddBlockDialog type="VOD" onAdd={handleSaveProgram} existingPrograms={mockEPGData} programToEdit={null} onCancel={() => {}} />
                    <AddBlockDialog type="Event" onAdd={handleSaveProgram} existingPrograms={mockEPGData} programToEdit={null} onCancel={() => {}} />
                    <Button variant="control" size="sm" onClick={() => setIsRepeatModalOpen(true)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy EPG
                    </Button>
                    <Button variant="control" size="sm" onClick={() => setIsManageAdsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Manage Ads
                    </Button>
                </div>
            </div>

            <div className="epg-layout-row">
                <div className="todays-programming-container">
                    <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)}>
                        <TabsList className="grid w-full grid-cols-3 bg-control-surface sticky top-0 bg-background z-10">
                            <TabsTrigger value="viewer" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
                                <Eye className="h-4 w-4 mr-2" />
                                Today’s EPG
                            </TabsTrigger>
                            <TabsTrigger value="affiliate" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
                                <FileText className="h-4 w-4 mr-2" />
                                Weekly EPG
                            </TabsTrigger>
                            <TabsTrigger value="api" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
                                <Code className="h-4 w-4 mr-2" />
                                Monthly EPG
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="viewer" className="mt-6">
                            <Card className="bg-card-dark border-border">
                                <CardContent>
                                    <div className="bg-control-surface rounded-lg p-4">
                                        <div className="text-center mb-4 pb-4 border-b border-border">
                                            <h2 className="text-xl font-bold text-broadcast-blue">TOI Global</h2>
                                            <p className="text-sm text-muted-foreground">Today's Programming</p>
                                        </div>
                                        <div className="space-y-3">
                                            {mockEPGData.filter(i => i.status === 'completed').map((item) => (
                                                <ProgramItem key={item.id} item={item} isDraggable={false} />
                                            ))}
                                            {mockEPGData.find(i => i.status === 'live') && (
                                                <ProgramItem item={mockEPGData.find(i => i.status === 'live')!} isDraggable={false} />
                                            )}
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext items={mockEPGData.filter(i => i.status === 'scheduled').map(item => item.id)} strategy={verticalListSortingStrategy}>
                                                    {mockEPGData.filter(i => i.status === 'scheduled').map((item) => (
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
                        </TabsContent>

                        <TabsContent value="affiliate" className="mt-6">
                            <Card className="bg-card-dark border-border">
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
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="api" className="mt-6">
                            <Card className="bg-card-dark border-border">
                                <CardContent className="p-6">
                                    <MonthlyView programs={mockEPGData} onDateClick={(date) => {
                                        setPreviewMode('viewer');
                                        // In a real app, you would have a more robust way to link dates between views
                                        // For now, we just switch the view
                                        console.log(`Switched to Today's EPG for date: ${date}`);
                                    }} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="distribution-card space-y-6">
                    <Card className="bg-card-dark border-border">
                        <CardHeader>
                            <CardTitle>Export Settings</CardTitle>
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
                                <Button variant="control" className="w-full">
                                    <Database className="h-4 w-4 mr-2" />
                                    Generate API URL
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card-dark border-border">
                        <Tabs defaultValue="json" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="json">JSON</TabsTrigger>
                                <TabsTrigger value="xml">XML</TabsTrigger>
                                <TabsTrigger value="xls">XLS</TabsTrigger>
                            </TabsList>
                            <TabsContent value="json">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>JSON Preview</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            navigator.clipboard.writeText(generatePreview('json'));
                                            toast({ title: "Copied to clipboard!" });
                                        }}>
                                            <ClipboardCopy className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs text-green-400 font-mono bg-black/50 rounded-lg p-3 max-h-60 overflow-auto">
                                            {generatePreview('json')}
                                        </pre>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="xml">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>XML Preview</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            navigator.clipboard.writeText(generatePreview('xml'));
                                            toast({ title: "Copied to clipboard!" });
                                        }}>
                                            <ClipboardCopy className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs text-green-400 font-mono bg-black/50 rounded-lg p-3 max-h-60 overflow-auto">
                                            {generatePreview('xml')}
                                        </pre>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="xls">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>XLS Preview</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={handleQuickXlsDownload}>
                                            <FileDown className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        {generateXlsPreview()}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </Card>
                    <Card className="bg-card-dark border-border">
                        <CardHeader>
                            <CardTitle>Distribution</CardTitle>
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