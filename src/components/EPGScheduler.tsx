import { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, Tag, Copy, RotateCcw, Settings, Edit, Trash2, GripVertical, X, MoreVertical, Play, Pause, SkipBack, SkipForward, Eye, Search, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ManageAdsModal } from './ManageAdsModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RepeatScheduleModal } from './RepeatScheduleModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EPGItem } from '../types';

interface Video {
  id: string;
  name: string;
  duration: number;
}

interface ScheduleBlock extends EPGItem {
  videos: { id: string; name: string; duration: number }[];
}

interface AdSlot {
  id: string;
  time: string;
  campaign: string;
  duration: string;
}

const adCampaigns = [
    { value: 'summer_blast', label: 'Summer Blast (0:30m)', adVideos: [{ id: 'ad1', name: 'Summer Ad 1', duration: 15 }, { id: 'ad2', name: 'Summer Ad 2', duration: 30 }] },
    { value: 'monsoon_magic', label: 'Monsoon Magic (1:00m)', adVideos: [{ id: 'ad3', name: 'Monsoon Ad 1', duration: 15 }, { id: 'ad4', name: 'Monsoon Ad 2', duration: 30 }, { id: 'ad5', name: 'Monsoon Ad 3', duration: 45 }] },
    { value: 'festive_offer', label: 'Festive Offer (1:15m)', adVideos: [{ id: 'ad6', name: 'Festive Ad 1', duration: 15 }, { id: 'ad7', name: 'Festive Ad 2', duration: 30 }, { id: 'ad8', name: 'Festive Ad 3', duration: 45 }] },
];

// Video Preview Dialog Component
const VideoPreviewDialog = ({ video, isOpen, onClose, isEditMode = false, onDelete, onSave }: {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  onDelete?: () => void;
  onSave?: (newIn: number, newOut: number) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [inMarker, setInMarker] = useState(0);
  const [outMarker, setOutMarker] = useState(video.duration * 60); // Convert minutes to seconds
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalDuration = video.duration * 60; // Convert minutes to seconds

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleMarkIn = () => {
    setInMarker(currentTime);
  };

  const handleMarkOut = () => {
    setOutMarker(currentTime);
  };

  const handleSave = () => {
    if (inMarker >= outMarker) {
      setError('In time must be less than Out time');
      return;
    }
    setError('');
    if (onSave) {
      onSave(inMarker, outMarker);
    }
    onClose();
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(totalDuration, currentTime + 10);
    setCurrentTime(newTime);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card-dark border-border max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditMode ? 'Edit Video' : 'Preview Video'} - {video.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Video Player Placeholder */}
          <div className="relative aspect-video bg-black rounded overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-2">📹</div>
                <p className="text-lg">{video.name}</p>
                <p className="text-sm opacity-70">Duration: {video.duration} minutes</p>
              </div>
            </div>
            {/* Play/Pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePlayPause}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
            </div>
          </div>

          {/* Video Controls */}
          <div className="space-y-3">
            {/* Seekbar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={0}
                    max={totalDuration}
                    value={currentTime}
                    onChange={(e) => setCurrentTime(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  {isEditMode && (
                    <>
                      {/* In Marker */}
                      <div
                        className="absolute top-0 w-2 h-2 bg-green-500 rounded-full transform -translate-y-1"
                        style={{ left: `${(inMarker / totalDuration) * 100}%` }}
                        title="In Marker"
                      >
                        <div className="absolute -top-6 -left-1 text-xs text-green-500">IN</div>
                      </div>
                      {/* Out Marker */}
                      <div
                        className="absolute top-0 w-2 h-2 bg-red-500 rounded-full transform -translate-y-1"
                        style={{ left: `${(outMarker / totalDuration) * 100}%` }}
                        title="Out Marker"
                      >
                        <div className="absolute -top-6 -left-2 text-xs text-red-500">OUT</div>
                      </div>
                    </>
                  )}
                </div>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" onClick={handleSkipBack}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSkipForward}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Mark In/Out Buttons (Edit Mode Only) */}
            {isEditMode && (
              <div className="flex items-center justify-center gap-4">
                <Button variant="secondary" size="sm" onClick={handleMarkIn}>
                  Mark IN ({formatTime(inMarker)})
                </Button>
                <Button variant="secondary" size="sm" onClick={handleMarkOut}>
                  Mark OUT ({formatTime(outMarker)})
                </Button>
              </div>
            )}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        </div>
        {isEditMode && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>CANCEL</Button>
            <Button onClick={handleSave}>SAVE</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const DraggableVideo = ({ video, blockId, blockTime, onDeleteVideo }: { 
  video: Video; 
  blockId: string; 
  blockTime: string;
  onDeleteVideo: (videoId: string) => void;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `${blockId}-${video.id}`,
    data: { video, blockId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine text color based on block time
  const getTextColor = () => {
    if (blockTime === '00:00' || blockTime === '01:00') {
      return 'text-gray-500'; // Gray cards use gray text
    }
    return 'text-white'; // Green and orange cards use white text
  };

  const handleDelete = () => {
    onDeleteVideo(video.id);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-1 bg-black/10 rounded text-xs"
      >
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className={`h-3 w-3 ${getTextColor()}`} />
          <span className="flex-1 truncate">{video.name}</span>
          <span className={getTextColor()}>{video.duration}m</span>
        </div>
        
        {/* Three Dot Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 hover:bg-black/20 ${getTextColor()}`}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card-dark border-border">
            <DropdownMenuItem 
              onClick={() => setShowPreview(true)}
              className="text-foreground hover:bg-accent"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowEdit(true)}
              className="text-foreground hover:bg-accent"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview Dialog */}
      <VideoPreviewDialog
        video={video}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* Edit Dialog */}
      <VideoPreviewDialog
        video={video}
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        isEditMode={true}
        onDelete={handleDelete}
        onSave={(newIn, newOut) => {
          console.log(`Video ${video.id} in block ${blockId} saved with new in/out markers:`, newIn, newOut);
          // Here you would typically update the state of the video object
        }}
      />
    </>
  );
};

const AddBlockDialog = ({ type, onAdd }: { type: 'VOD' | 'Event', onAdd: (item: ScheduleBlock) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(60);
    const [geoZone, setGeoZone] = useState('Global');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'live' | 'scheduled' | 'completed'>('scheduled');
    const [genre, setGenre] = useState('');
    const [image, setImage] = useState<string | null>('/toi_global_poster.png');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAdd = () => {
        const newItem: ScheduleBlock = {
            id: new Date().toISOString(),
            time: '00:00',
            title,
            type: type,
            duration,
            geoZone,
            description,
            status,
            genre,
            isEditing: false,
            imageUrl: image || '/toi_global_poster.png',
            videos: []
        };
        onAdd(newItem);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant={type === 'Event' ? 'live' : 'playlist'} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {type === 'VOD' ? 'Recorded Program' : 'Live Program'}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card-dark border-border">
                <DialogHeader>
                    <DialogTitle>Schedule {type === 'VOD' ? 'Recorded' : 'Live'} Program</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-control-surface border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="bg-control-surface border-border" />
                        </div>
                        <div>
                            <Label htmlFor="geoZone">Geo Zone</Label>
                            <Select value={geoZone} onValueChange={setGeoZone}>
                                <SelectTrigger className="bg-control-surface border-border">
                                    <SelectValue placeholder="Select geo zone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Global">Global</SelectItem>
                                    <SelectItem value="US/EU">US/EU</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-control-surface border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                                <SelectTrigger className="bg-control-surface border-border">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="live">Live</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="genre">Genre</Label>
                            <Select value={genre} onValueChange={setGenre}>
                                <SelectTrigger className="bg-control-surface border-border">
                                    <SelectValue placeholder="Select genre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="news">News</SelectItem>
                                    <SelectItem value="sports">Sports</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button variant="broadcast" onClick={handleAdd}>Add to Schedule</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const EPGScheduler = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChannel, setSelectedChannel] = useState('Fast Channel 1');
  const [isAdConfigOpen, setIsAdConfigOpen] = useState(false);
  const [editingGenres, setEditingGenres] = useState<string | null>(null);
  const [isManageAdsModalOpen, setIsManageAdsModalOpen] = useState(false);
  const [adSlots, setAdSlots] = useState<Record<string, AdSlot[]>>({});
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);

  const initialSchedule: ScheduleBlock[] = [
      {
        id: '0',
        time: '00:00',
        duration: 60,
        title: 'Midnight Movies',
        type: 'VOD',
        status: 'completed',
        geoZone: 'Global',
        genre: 'Movies',
        description: 'Late night movie programming',
        videos: [
          { id: 'v1', name: 'Classic Horror Movie', duration: 90 },
          { id: 'v2', name: 'Sci-Fi Thriller', duration: 105 }
        ]
      },
      {
        id: '1',
        time: '01:00',
        duration: 60,
        title: 'Night Talk Show',
        type: 'Event',
        status: 'completed',
        geoZone: 'US/EU',
        genre: 'Talk',
        description: 'Late night talk show',
        videos: [
          { id: 'v3', name: 'Celebrity Interview', duration: 25 },
          { id: 'v4', name: 'Comedy Segment', duration: 15 }
        ]
      },
      {
        id: '2',
        time: '02:00',
        duration: 60,
        title: 'Morning News Live',
        type: 'Event',
        status: 'live',
        geoZone: 'Global',
        genre: 'News',
        description: 'Live morning news broadcast',
        videos: [
          { id: 'v5', name: 'Breaking News Report', duration: 20 },
          { id: 'v6', name: 'Weather Update', duration: 10 },
          { id: 'v7', name: 'Sports Highlights', duration: 15 }
        ]
      },
      {
        id: '3',
        time: '03:00',
        duration: 60,
        title: 'Talk Show Today',
        type: 'Event',
        status: 'scheduled',
        geoZone: 'Global',
        genre: 'Talk',
        description: 'Morning talk show',
        videos: [
          { id: 'v8', name: 'Guest Interview 1', duration: 20 },
          { id: 'v9', name: 'Musical Performance', duration: 15 },
          { id: 'v10', name: 'Guest Interview 2', duration: 20 }
        ]
      },
      {
        id: '4',
        time: '04:00',
        duration: 60,
        title: 'Coffee Break Show',
        type: 'VOD',
        status: 'scheduled',
        geoZone: 'US/EU',
        genre: 'Lifestyle',
        description: 'Light entertainment programming',
        videos: [
          { id: 'v11', name: 'Cooking Segment', duration: 25 },
          { id: 'v12', name: 'Home Tips', duration: 20 }
        ]
      },
      {
        id: '5',
        time: '05:00',
        duration: 60,
        title: 'Game Time',
        type: 'VOD',
        status: 'scheduled',
        geoZone: 'Global',
        genre: 'Games',
        description: 'Interactive game show',
        videos: [
          { id: 'v13', name: 'Trivia Round', duration: 30 },
          { id: 'v14', name: 'Prize Challenge', duration: 25 }
        ]
      },
      {
        id: '6',
        time: '06:00',
        duration: 60,
        title: 'Morning Movies',
        type: 'VOD',
        status: 'scheduled',
        geoZone: 'US/EU',
        genre: 'Movies',
        description: 'Classic movie collection',
        videos: [
          { id: 'v15', name: 'Family Adventure', duration: 95 },
          { id: 'v16', name: 'Comedy Classic', duration: 85 }
        ]
      },
      {
        id: '7',
        time: '07:00',
        duration: 60,
        title: 'Breakfast Special',
        type: 'Event',
        status: 'scheduled',
        geoZone: 'Global',
        genre: 'Special',
        description: 'Special morning programming',
        videos: [
          { id: 'v17', name: 'Morning Yoga', duration: 20 },
          { id: 'v18', name: 'Healthy Recipes', duration: 25 }
        ]
      }
  ];
  
  const [scheduleBlocks, setScheduleBlocks] = useState<Record<string, ScheduleBlock[]>>({
      [new Date().toISOString().split('T')[0]]: initialSchedule
  });

  const currentSchedule = scheduleBlocks[selectedDate] || [];
  const currentAdSlots = adSlots[selectedDate] || [];

  const availableGenres = ['Movies', 'Classic', 'Games', 'Fun', 'Sports', 'News', 'Entertainment', 'Documentary', 'Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Family', 'Kids'];
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  // Calculate cumulative Y positions for dynamic repositioning
  const calculateTimeSlotPositions = () => {
    const positions = new Map<string, number>();
    let currentY = 0;
    
    timeSlots.forEach((time) => {
      positions.set(time, currentY);
      
      const isHour = time.endsWith(':00');
      const blockForTime = currentSchedule.find(block => block.time === time);
      const hasBlock = !!blockForTime;

      if (isHour || hasBlock) {
        const baseRowHeight = 60;
        const blockHeight = hasBlock 
          ? Math.max(120, 80 + (blockForTime.videos.length * 32)) + 16 // +16 for padding
          : baseRowHeight;
        
        currentY += Math.max(baseRowHeight, blockHeight);
      }
    });
    
    return positions;
  };

  const timeSlotPositions = calculateTimeSlotPositions();
  const totalHeight = Math.max(...Array.from(timeSlotPositions.values())) + 200; // Extra space for last row

  const getBlockColor = (time: string, status: string) => {
    // Midnight Movies (00:00) and Night Talk Show (01:00) get light gray
    if (time === '00:00' || time === '01:00') {
      return 'border-2 bg-gray-300 text-black border-gray-300';
    }
    // Only the 02:00 time slot gets green color
    if (time === '02:00') {
      return 'border-2 bg-[#ACC572] text-white border-[#ACC572]';
    }
    // Rest are orange
    return 'border-2 bg-[#FFA55D] text-white border-[#FFA55D]';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    
    // If dragging to a different block
    if (activeData?.blockId !== overData?.blockId && overData?.blockId) {
      const sourceBlockId = activeData?.blockId;
      const targetBlockId = overData?.blockId;
      const video = activeData?.video;
      
      if (sourceBlockId && targetBlockId && video) {
        setScheduleBlocks(prev => {
          const newBlocks = { ...prev };
          const sourceSchedule = [...(newBlocks[sourceBlockId] || [])];
          const targetSchedule = [...(newBlocks[targetBlockId] || [])];
          
          const sourceBlock = sourceSchedule.find(b => b.id === sourceBlockId);
          if (sourceBlock) {
            sourceBlock.videos = sourceBlock.videos.filter(v => v.id !== video.id);
          }
          
          const targetBlock = targetSchedule.find(b => b.id === targetBlockId);
          if (targetBlock) {
            targetBlock.videos = [...targetBlock.videos, video];
          }

          newBlocks[sourceBlockId] = sourceSchedule;
          newBlocks[targetBlockId] = targetSchedule;
          
          return newBlocks;
        });
      }
    }
    // If reordering within the same block
    else if (activeData?.blockId === overData?.blockId) {
      const blockId = activeData?.blockId;
      const activeVideoId = active.id.toString().split('-')[1];
      const overVideoId = over.id.toString().split('-')[1];
      
      if (blockId && activeVideoId !== overVideoId) {
        setScheduleBlocks(prev => {
          const newBlocks = { ...prev };
          const schedule = [...(newBlocks[selectedDate] || [])];
          const block = schedule.find(b => b.id === blockId);
          
          if (block) {
            const oldIndex = block.videos.findIndex(v => v.id === activeVideoId);
            const newIndex = block.videos.findIndex(v => v.id === overVideoId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
              block.videos = arrayMove(block.videos, oldIndex, newIndex);
            }
          }

          newBlocks[selectedDate] = schedule;
          return newBlocks;
        });
      }
    }
  };

  const updateBlockTitle = (blockId: string, newTitle: string) => {
    setScheduleBlocks(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(block => 
        block.id === blockId 
          ? { ...block, title: newTitle, isEditing: false }
          : block
      )
    }));
  };

  const toggleEditMode = (blockId: string) => {
    setScheduleBlocks(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(block => 
        block.id === blockId 
          ? { ...block, isEditing: !block.isEditing }
          : { ...block, isEditing: false }
      )
    }));
  };

  const toggleGenreEdit = (blockId: string) => {
    setEditingGenres(editingGenres === blockId ? null : blockId);
  };

  const updateBlockTags = (blockId: string, newTags: string[]) => {
    setScheduleBlocks(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(block => 
        block.id === blockId 
          ? { ...block, genre: newTags.join(', ') }
          : block
      )
    }));
  };

  const addGenreToBlock = (blockId: string, genre: string) => {
    console.log('Adding genre:', genre, 'to block:', blockId);
    setScheduleBlocks(prev => {
        const newBlocks = { ...prev };
        const schedule = (newBlocks[selectedDate] || []).map(block => 
            block.id === blockId 
            ? { ...block, genre: genre }
            : block
        );
        newBlocks[selectedDate] = schedule;
        return newBlocks;
    });
    setEditingGenres(null);
  };

  const removeGenreFromBlock = (blockId: string, genreToRemove: string) => {
    setScheduleBlocks(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(block => 
        block.id === blockId 
          ? { ...block, genre: '' }
          : block
      )
    }));
  };

  const deleteVideoFromBlock = (blockId: string, videoId: string) => {
    setScheduleBlocks(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map(block => 
        block.id === blockId 
          ? { ...block, videos: block.videos.filter(video => video.id !== videoId) }
          : block
      )
    }));
  };

  // Get the last orange card's end time
  const getLastOrangeCardEndTime = () => {
    const orangeBlocks = currentSchedule.filter(block => 
      block.time !== '00:00' && block.time !== '01:00' && block.time !== '02:00'
    );
    
    if (orangeBlocks.length === 0) return '02:00'; // Default if no orange cards
    
    // Find the latest orange block
    const latestBlock = orangeBlocks.reduce((latest, current) => {
      const latestTime = parseInt(latest.time.split(':')[0]) * 60 + parseInt(latest.time.split(':')[1]);
      const currentTime = parseInt(current.time.split(':')[0]) * 60 + parseInt(current.time.split(':')[1]);
      return currentTime > latestTime ? current : latest;
    });
    
    // Calculate end time by adding duration
    const startMinutes = parseInt(latestBlock.time.split(':')[0]) * 60 + parseInt(latestBlock.time.split(':')[1]);
    const endMinutes = startMinutes + latestBlock.duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const addBlankOrangeCard = () => {
    const newStartTime = getLastOrangeCardEndTime();
    const newId = (currentSchedule.length + 1).toString();
    
    const newBlock: ScheduleBlock = {
      id: newId,
      time: newStartTime,
      duration: 60,
      title: 'New Program',
      type: 'VOD',
      status: 'scheduled',
      geoZone: 'Global',
      genre: '',
      description: '',
      videos: []
    };
    
    setScheduleBlocks(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), newBlock] }));
  };

  const handleAdSave = (adConfig: { campaign: string; duration: string; frequency: string }) => {
    const { campaign, duration, frequency } = adConfig;
    const frequencyHours = parseFloat(frequency.replace('hr', ''));
    const frequencyMilliseconds = frequencyHours * 60 * 60 * 1000;
    
    const newAdSlots: AdSlot[] = [];
    const campaignData = adCampaigns.find(c => c.value === campaign);

    for (let i = 0; i < 24 * 60 * 60 * 1000; i += frequencyMilliseconds) {
      const adTime = new Date(i).toISOString().substr(11, 5);
      newAdSlots.push({
        id: `ad-${adTime}`,
        time: adTime,
        campaign: campaignData?.label || 'Ad',
        duration,
      });
    }
    
    setAdSlots(prev => ({ ...prev, [selectedDate]: newAdSlots }));
    setIsManageAdsModalOpen(false);
  };

  const handleRepeatSave = (startDate: string, endDate: string, selectedDays: number[]) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const scheduleToCopy = currentSchedule;
    const adSlotsToCopy = currentAdSlots;

    let currentDate = start;
    const newSchedules = { ...scheduleBlocks };
    const newAdSlots = { ...adSlots };

    while (currentDate <= end) {
      if (selectedDays.includes(currentDate.getDay())) {
        const dateString = currentDate.toISOString().split('T')[0];
        newSchedules[dateString] = scheduleToCopy;
        newAdSlots[dateString] = adSlotsToCopy;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setScheduleBlocks(newSchedules);
    setAdSlots(newAdSlots);
    setIsRepeatModalOpen(false);
  };

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TOI Global</h1>
          <p className="text-muted-foreground">Event programming schedule</p>
          <div className="flex items-start gap-8 mt-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>On Air: Morning News Live</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Start Time: 02:00 | End Time: 03:00 | Playback Time: 25:30 | Remaining Time: 34:30
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Next In Queue: Talk Show Today</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Start Time: 03:00 | End Time: 04:00
              </p>
            </div>
          </div>
        </div>
        <div className="relative aspect-video bg-black rounded overflow-hidden w-64">
          <div className="absolute inset-0 bg-gradient-to-br from-broadcast-blue/30 to-pcr-live/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pcr-live flex items-center justify-center animate-pulse-live">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
              <p className="text-xs text-white/80">Studio 1 - LIVE</p>
            </div>
          </div>
          <div className="absolute top-2 left-2">
            <Badge className="bg-pcr-live text-white text-xs animate-pulse-live">
              ● LIVE
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Controls */}
        <div className="col-span-3 space-y-4">
          {/* Live Broadcast Preview - This section will be removed */}

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Add Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Content Accordion */}
              <Accordion type="single" defaultValue="slike-video" className="w-full">
                 <AccordionItem value="slike-video" className="border-border">
                   <AccordionTrigger className="text-sm text-foreground hover:text-foreground/80 [&>svg]:hidden">
                     <div className="flex items-center justify-between w-full">
                       Slike Video
                       <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </div>
                   </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by title or video ID..." 
                        className="pl-8 bg-control-surface border-border text-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {[
                        { id: 'sv1', name: 'Action Movie Trailer', duration: 3 },
                        { id: 'sv2', name: 'Comedy Special', duration: 25 },
                        { id: 'sv3', name: 'Documentary Clip', duration: 15 }
                       ].map(video => (
                         <div 
                           key={video.id} 
                           className="flex items-center justify-between p-2 bg-black/10 rounded text-xs cursor-grab active:cursor-grabbing"
                           draggable
                           onDragStart={(e) => {
                             e.dataTransfer.setData('application/json', JSON.stringify({
                               type: 'content-video',
                               video: video
                             }));
                           }}
                         >
                           <span className="flex-1 text-foreground">{video.name}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-muted-foreground">{video.duration}m</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => {/* Preview functionality - opens VideoPreviewDialog */}}
                             >
                               <Eye className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="event-recording" className="border-border">
                   <AccordionTrigger className="text-sm text-foreground hover:text-foreground/80 [&>svg]:hidden">
                     <div className="flex items-center justify-between w-full">
                       Event Recording
                       <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </div>
                   </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by title or event ID..." 
                        className="pl-8 bg-control-surface border-border text-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {[
                        { id: 'er1', name: 'Sports Match Recording', duration: 90 },
                        { id: 'er2', name: 'Concert Performance', duration: 45 },
                        { id: 'er3', name: 'Conference Highlights', duration: 30 }
                       ].map(recording => (
                         <div 
                           key={recording.id} 
                           className="flex items-center justify-between p-2 bg-black/10 rounded text-xs cursor-grab active:cursor-grabbing"
                           draggable
                           onDragStart={(e) => {
                             e.dataTransfer.setData('application/json', JSON.stringify({
                               type: 'content-video',
                               video: recording
                             }));
                           }}
                         >
                           <span className="flex-1 text-foreground">{recording.name}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-muted-foreground">{recording.duration}m</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => {/* Preview functionality - opens VideoPreviewDialog */}}
                             >
                               <Eye className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="live-event" className="border-border">
                   <AccordionTrigger className="text-sm text-foreground hover:text-foreground/80 [&>svg]:hidden">
                     <div className="flex items-center justify-between w-full">
                       Live Event
                       <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </div>
                   </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by title or live event ID..." 
                        className="pl-8 bg-control-surface border-border text-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {[
                        { id: 'le1', name: 'Morning News Live', duration: 60 },
                        { id: 'le2', name: 'Talk Show Live', duration: 45 },
                        { id: 'le3', name: 'Breaking News', duration: 15 }
                       ].map(liveEvent => (
                         <div 
                           key={liveEvent.id} 
                           className="flex items-center justify-between p-2 bg-black/10 rounded text-xs cursor-grab active:cursor-grabbing"
                           draggable
                           onDragStart={(e) => {
                             e.dataTransfer.setData('application/json', JSON.stringify({
                               type: 'content-video',
                               video: liveEvent
                             }));
                           }}
                         >
                           <span className="flex-1 text-foreground">{liveEvent.name}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-muted-foreground">{liveEvent.duration}m</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => {/* Preview functionality - opens VideoPreviewDialog */}}
                             >
                               <Eye className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="youtube-url" className="border-border">
                   <AccordionTrigger className="text-sm text-foreground hover:text-foreground/80 [&>svg]:hidden">
                     <div className="flex items-center justify-between w-full">
                       YouTube URL
                       <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </div>
                   </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter YouTube URL..." 
                        className="flex-1 bg-control-surface border-border text-foreground text-sm"
                      />
                      <Button variant="outline" size="sm">
                        GO
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {[
                        { id: 'yt1', name: 'Music Video - Artist Name', duration: 4 },
                        { id: 'yt2', name: 'Tutorial Video', duration: 12 },
                        { id: 'yt3', name: 'Comedy Sketch', duration: 8 }
                       ].map(youtubeVideo => (
                         <div 
                           key={youtubeVideo.id} 
                           className="flex items-center justify-between p-2 bg-black/10 rounded text-xs cursor-grab active:cursor-grabbing"
                           draggable
                           onDragStart={(e) => {
                             e.dataTransfer.setData('application/json', JSON.stringify({
                               type: 'content-video',
                               video: youtubeVideo
                             }));
                           }}
                         >
                           <span className="flex-1 text-foreground">{youtubeVideo.name}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-muted-foreground">{youtubeVideo.duration}m</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => {/* Preview functionality - opens VideoPreviewDialog */}}
                             >
                               <Eye className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
            </CardContent>
          </Card>
        </div>

        {/* Main Schedule Grid */}
        <div className="col-span-9 overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Card className="bg-card-dark border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>Program Schedule - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="flex items-center gap-1">
                    <AddBlockDialog type="VOD" onAdd={(item) => setScheduleBlocks(prev => ({
                      ...prev,
                      [selectedDate]: [...(prev[selectedDate] || []), item]
                    }))} />
                    <AddBlockDialog type="Event" onAdd={(item) => setScheduleBlocks(prev => ({
                      ...prev,
                      [selectedDate]: [...(prev[selectedDate] || []), item]
                    }))} />
                    <Button variant="control" size="sm" onClick={() => setIsRepeatModalOpen(true)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy EPG
                    </Button>
                    <Button variant="control" size="sm" onClick={() => setIsManageAdsModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Ads
                    </Button>
                    <div className="flex items-center">
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-control-surface border-border text-foreground w-32 text-xs"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[75vh] overflow-y-auto">
                <div className="relative" style={{ height: `${totalHeight}px` }}>
                  {/* Time Slots */}
                  <div className="relative">
                    {timeSlots.map((time, index) => {
                      const isHour = time.endsWith(':00');
                      const hasBlock = currentSchedule.some(block => block.time === time);

                      if (!isHour && !hasBlock) {
                        return null;
                      }

                      return (
                        <div 
                          key={time} 
                          className="absolute w-full"
                          style={{ top: `${timeSlotPositions.get(time) || 0}px` }}
                        >
                          <div className="flex items-center gap-4 py-2 border-b border-border/30">
                            <div className="w-16 text-xs text-muted-foreground font-mono">
                              {time}
                            </div>
                            <div className="flex-1 min-h-[60px] relative">
                              {/* Red playhead arrow for current time (02:00) */}
                              {time === '02:00' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center">
                                  <div className="w-0 h-0 border-l-[8px] border-l-red-500 border-y-[6px] border-y-transparent"></div>
                                  <div className="w-1 h-8 bg-red-500 -ml-px"></div>
                                </div>
                              )}
                              <TooltipProvider>
                                <div className="absolute top-1/2 -translate-y-1/2 flex items-center space-x-4" style={{ left: '-20px' }}>
                                  {currentAdSlots.filter(ad => {
                                      const adHour = parseInt(ad.time.split(':')[0]);
                                      const timeHour = parseInt(time.split(':')[0]);
                                      return adHour === timeHour;
                                  }).map(ad => (
                                    <Tooltip key={ad.id}>
                                      <TooltipTrigger asChild>
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full cursor-pointer" style={{ left: `${(parseInt(ad.time.split(':')[1]) / 60) * 100}%`, position: 'absolute' }}></div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-card-dark text-foreground border-border">
                                        <p>{ad.campaign}</p>
                                        <p>Duration: {ad.duration}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </TooltipProvider>
                               {/* Drop zone for scheduling */}
                               <div 
                                 className="absolute inset-0 border-2 border-dashed border-transparent hover:border-broadcast-blue/50 rounded transition-colors"
                                 onDragOver={(e) => e.preventDefault()}
                                 onDrop={(e) => {
                                   e.preventDefault();
                                   const data = e.dataTransfer.getData('application/json');
                                   if (data) {
                                     try {
                                       const draggedData = JSON.parse(data);
                                       if (draggedData.type === 'content-video') {
                                         // Find the block for this time slot
                                         const targetBlock = currentSchedule.find(block => block.time === time);
                                         if (targetBlock) {
                                           // Add the dragged video to the target block
                                           setScheduleBlocks(prev => ({
                                             ...prev,
                                             [selectedDate]: (prev[selectedDate] || []).map(block => 
                                               block.id === targetBlock.id 
                                                 ? { ...block, videos: [...block.videos, draggedData.video] }
                                                 : block
                                             )
                                           }));
                                         }
                                       }
                                     } catch (error) {
                                       console.error('Error parsing dragged data:', error);
                                     }
                                   }
                                 }}
                               >
                                {/* Scheduled blocks */}
                                {currentSchedule
                                  .filter(block => block.time === time && block.title !== 'Ad Break')
                                  .map(block => {
                                    const totalDuration = block.videos.reduce((acc, v) => acc + v.duration, 0);

                                    return (
                                     <div
                                         key={block.id}
                                         className={`
                                           p-3 rounded border-2 cursor-pointer transition-colors duration-200 hover:shadow-lg hover:scale-[1.02] relative z-10
                                           ${getBlockColor(block.time, block.status)}
                                         `}
                                       style={{ 
                                         minHeight: `${Math.max(120, 80 + (block.videos.length * 32))}px` 
                                       }}
                                       data-block-id={block.id}
                                     >
                                       <div className="flex items-center justify-between mb-2">
                                         <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {block.isEditing ? (
                                            <Input
                                              value={block.title}
                                              onChange={(e) => setScheduleBlocks(prev => ({
                                                ...prev,
                                                [selectedDate]: (prev[selectedDate] || []).map(b => b.id === block.id ? { ...b, title: e.target.value } : b)
                                              }))}
                                              onBlur={() => updateBlockTitle(block.id, block.title)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  updateBlockTitle(block.id, block.title);
                                                }
                                              }}
                                              className="text-sm font-medium bg-white/90 text-black border-none h-6 px-1"
                                              autoFocus
                                            />
                                           ) : (
                                              <span className={`font-medium text-sm truncate ${
                                                (block.title === 'Midnight Movies' || block.title === 'Night Talk Show') 
                                                  ? 'text-black' 
                                                  : 'text-white'
                                              }`}>
                                                {block.title}
                                              </span>
                                           )}
                                           <button
                                             onClick={() => toggleEditMode(block.id)}
                                             className={`flex-shrink-0 p-1 rounded hover:bg-black/20 ${
                                               block.status === 'completed' ? 'text-black/60' : 'text-white'
                                             }`}
                                           >
                                             <Edit className="h-3 w-3" />
                                           </button>
                                           <div className="flex gap-1 ml-2 relative">
                                             {block.genre.split(', ').map((genre, idx) => (
                                              <div key={idx} className="relative group">
                                                 <span className={`text-xs px-1 py-0.5 rounded cursor-pointer ${
                                                   block.status === 'completed' 
                                                     ? 'bg-black/10 text-black' 
                                                     : 'bg-black/30 text-white'
                                                 }`}>
                                                  {genre}
                                                  {editingGenres === block.id && (
                                                    <button
                                                      onClick={() => removeGenreFromBlock(block.id, genre)}
                                                      className="ml-1 text-red-400 hover:text-red-300"
                                                    >
                                                      <X className="h-2 w-2" />
                                                    </button>
                                                  )}
                                                </span>
                                              </div>
                                            ))}
                                             <button
                                               onClick={() => toggleGenreEdit(block.id)}
                                               className={`text-xs px-1 py-0.5 rounded hover:bg-black/40 ${
                                                 block.status === 'completed' ? 'text-black/60' : 'text-white'
                                               }`}
                                             >
                                               <Edit className="h-3 w-3" />
                                             </button>
                                            {editingGenres === block.id && (
                                              <div className="absolute top-6 left-0 z-10 bg-card-dark border border-border rounded-md p-2 shadow-lg">
                                                <div className="flex flex-wrap gap-1 w-48">
                                                  {availableGenres
                                                    .filter(genre => !block.genre.split(', ').includes(genre))
                                                    .map(genre => (
                                                      <button
                                                        key={genre}
                                                        onClick={() => addGenreToBlock(block.id, genre)}
                                                        className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary/80"
                                                      >
                                                        {genre}
                                                      </button>
                                                    ))}
                                                </div>
                                                <button
                                                  onClick={() => setEditingGenres(null)}
                                                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                  Done
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold ${
                                                block.time === '00:00' || block.time === '01:00' ? 'text-black' : 'text-white'
                                            }`}>
                                                Duration: {formatDuration(totalDuration)}
                                            </span>
                                            <Badge 
                                              className="text-xs bg-black/30 text-white"
                                            >
                                              {block.type}
                                            </Badge>
                                          {block.status === 'live' && (
                                            <div className="w-2 h-2 bg-pcr-live-glow rounded-full animate-pulse-live"></div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-3">
                                        {/* Videos List */}
                                        <div className="flex-1">
                                          <SortableContext 
                                            items={block.videos.map(v => `${block.id}-${v.id}`)} 
                                            strategy={verticalListSortingStrategy}
                                          >
                                            <div className="space-y-1">
                                               {block.videos.map(video => (
                                                 <DraggableVideo 
                                                   key={video.id} 
                                                   video={video} 
                                                   blockId={block.id} 
                                                   blockTime={block.time}
                                                   onDeleteVideo={(videoId) => deleteVideoFromBlock(block.id, videoId)}
                                                 />
                                               ))}
                                            </div>
                                          </SortableContext>
                                        </div>
                                        
                                         {/* Block Info */}
                                         <div className="flex-shrink-0 text-right">
                                         </div>
                                      </div>
                                    </div>
                                  )}
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </DndContext>
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
    </div>
  );
};