import { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, Tag, Copy, RotateCcw, Settings, Edit, Trash2, GripVertical, X, MoreVertical, Play, Pause, SkipBack, SkipForward, Eye } from 'lucide-react';
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

interface Video {
  id: string;
  name: string;
  duration: number;
}

interface ScheduleBlock {
  id: string;
  time: string;
  duration: number;
  title: string;
  type: 'VOD' | 'Event';
  status: 'scheduled' | 'live' | 'completed';
  geoZone: string;
  tags: string[];
  description?: string;
  videos: Video[];
  isEditing?: boolean;
}

// Video Preview Dialog Component
const VideoPreviewDialog = ({ video, isOpen, onClose, isEditMode = false, onDelete }: {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  onDelete?: () => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [inMarker, setInMarker] = useState(0);
  const [outMarker, setOutMarker] = useState(video.duration * 60); // Convert minutes to seconds
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
          <DialogTitle className="text-foreground flex items-center justify-between">
            {isEditMode ? 'Edit Video' : 'Preview Video'} - {video.name}
            {isEditMode && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
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
          </div>
        </div>
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
      />
    </>
  );
};

export const EPGScheduler = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdConfigOpen, setIsAdConfigOpen] = useState(false);
  const [editingGenres, setEditingGenres] = useState<string | null>(null);
  
  const availableGenres = ['Movies', 'Classic', 'Games', 'Fun', 'Sports', 'News', 'Entertainment', 'Documentary', 'Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Family', 'Kids'];
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([
    {
      id: '0',
      time: '00:00',
      duration: 60,
      title: 'Midnight Movies',
      type: 'VOD',
      status: 'completed',
      geoZone: 'Global',
      tags: ['Movies', 'Late Night'],
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
      tags: ['Talk', 'Late Night'],
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
      tags: ['Live', 'News'],
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
      tags: ['Talk', 'Entertainment'],
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
      tags: ['Lifestyle', 'Entertainment'],
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
      tags: ['Games', 'Fun'],
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
      tags: ['Movies', 'Classic'],
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
      tags: ['Special', 'Morning'],
      description: 'Special morning programming',
      videos: [
        { id: 'v17', name: 'Morning Yoga', duration: 20 },
        { id: 'v18', name: 'Healthy Recipes', duration: 25 }
      ]
    }
  ]);

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
          const newBlocks = [...prev];
          
          // Remove video from source block
          const sourceBlock = newBlocks.find(b => b.id === sourceBlockId);
          if (sourceBlock) {
            sourceBlock.videos = sourceBlock.videos.filter(v => v.id !== video.id);
          }
          
          // Add video to target block
          const targetBlock = newBlocks.find(b => b.id === targetBlockId);
          if (targetBlock) {
            targetBlock.videos = [...targetBlock.videos, video];
          }
          
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
          const newBlocks = [...prev];
          const block = newBlocks.find(b => b.id === blockId);
          
          if (block) {
            const oldIndex = block.videos.findIndex(v => v.id === activeVideoId);
            const newIndex = block.videos.findIndex(v => v.id === overVideoId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
              block.videos = arrayMove(block.videos, oldIndex, newIndex);
            }
          }
          
          return newBlocks;
        });
      }
    }
  };

  const updateBlockTitle = (blockId: string, newTitle: string) => {
    setScheduleBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, title: newTitle, isEditing: false }
          : block
      )
    );
  };

  const toggleEditMode = (blockId: string) => {
    setScheduleBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, isEditing: !block.isEditing }
          : { ...block, isEditing: false }
      )
    );
  };

  const toggleGenreEdit = (blockId: string) => {
    setEditingGenres(editingGenres === blockId ? null : blockId);
  };

  const updateBlockTags = (blockId: string, newTags: string[]) => {
    setScheduleBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, tags: newTags }
          : block
      )
    );
  };

  const addGenreToBlock = (blockId: string, genre: string) => {
    console.log('Adding genre:', genre, 'to block:', blockId);
    setScheduleBlocks(prev => {
      const updated = prev.map(block => 
        block.id === blockId 
          ? { ...block, tags: [genre] }
          : block
      );
      console.log('Updated blocks:', updated.find(b => b.id === blockId)?.tags);
      return updated;
    });
    setEditingGenres(null);
  };

  const removeGenreFromBlock = (blockId: string, genreToRemove: string) => {
    setScheduleBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, tags: block.tags.filter(tag => tag !== genreToRemove) }
          : block
      )
    );
  };

  const deleteVideoFromBlock = (blockId: string, videoId: string) => {
    setScheduleBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, videos: block.videos.filter(video => video.id !== videoId) }
          : block
      )
    );
  };

  const AddBlockDialog = ({ type }: { type: 'VOD' | 'Event' }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant={type === 'Event' ? 'live' : 'playlist'} 
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {type} Block
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card-dark border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Add {type === 'Event' ? 'Live Event' : 'VOD Content'} Block
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input 
                id="start-time" 
                type="time" 
                className="bg-control-surface border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input 
                id="duration" 
                type="number" 
                placeholder="60"
                className="bg-control-surface border-border text-foreground"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="title">Program Title</Label>
            <Input 
              id="title" 
              placeholder="Enter program title"
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          {type === 'Event' && (
            <div>
              <Label htmlFor="studio">Studio ID</Label>
              <Select>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue placeholder="Select studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio-1">Studio 1 (Main)</SelectItem>
                  <SelectItem value="studio-2">Studio 2 (News)</SelectItem>
                  <SelectItem value="studio-3">Studio 3 (Sports)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'VOD' && (
            <div>
              <Label htmlFor="playlist">Content Library</Label>
              <Select>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue placeholder="Select content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movies-classic">Classic Movies</SelectItem>
                  <SelectItem value="tv-shows">TV Shows Collection</SelectItem>
                  <SelectItem value="documentaries">Documentaries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="geo-zone">Geographic Zone</Label>
            <Select>
              <SelectTrigger className="bg-control-surface border-border text-foreground">
                <SelectValue placeholder="Select geo zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="us-eu">US/EU</SelectItem>
                <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                <SelectItem value="americas">Americas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input 
              id="tags" 
              placeholder="Breaking, News, Special (comma separated)"
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Program description..."
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="broadcast" className="flex-1">
              Add to Schedule
            </Button>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">EPG Scheduler</h1>
          <p className="text-muted-foreground">Drag & drop programming schedule</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="control">
            <Copy className="h-4 w-4 mr-2" />
            Copy Schedule
          </Button>
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Fast Channel Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Fast Channel 1</h2>
        <div className="grid grid-cols-10 gap-4">
          {/* On Air Section - 60% width */}
          <div className="col-span-6">
            <Card className="bg-card-dark border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  On Air
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-medium">Morning News Live</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-foreground">
                  Start Time: 02:00 | End Time: 03:00 | Playback Time: 25:30 | Remaining Time: 34:30
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next In Queue Section - 40% width */}
          <div className="col-span-4">
            <Card className="bg-card-dark border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  Next In Queue
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-lg font-medium">Talk Show Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground">Start Time: 03:00</span>
                    <span className="text-foreground">End Time: 04:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Controls */}
        <div className="col-span-3 space-y-4">
          {/* Live Broadcast Preview */}
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Live Broadcast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-black rounded overflow-hidden">
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
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Add Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AddBlockDialog type="VOD" />
              <AddBlockDialog type="Event" />
              <Button variant="outline" size="sm" className="w-full justify-start bg-slate-600 text-white border-slate-600 hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                YouTube Link
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Schedule Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={isAdConfigOpen} onOpenChange={setIsAdConfigOpen}>
                <DialogTrigger asChild>
                  <Button variant="control" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure AD
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card-dark border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Ad Configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ad-interval">Ad Interval (Hours)</Label>
                      <Select>
                        <SelectTrigger className="bg-control-surface border-border text-foreground">
                          <SelectValue placeholder="Select ad interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00:15">00:15</SelectItem>
                          <SelectItem value="00:30">00:30</SelectItem>
                          <SelectItem value="00:45">00:45</SelectItem>
                          <SelectItem value="01:00">01:00</SelectItem>
                          <SelectItem value="01:15">01:15</SelectItem>
                          <SelectItem value="01:30">01:30</SelectItem>
                          <SelectItem value="01:45">01:45</SelectItem>
                          <SelectItem value="02:00">02:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="ad-duration">Ad Duration (Mins)</Label>
                      <Select>
                        <SelectTrigger className="bg-control-surface border-border text-foreground">
                          <SelectValue placeholder="Select ad duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00:10">00:10</SelectItem>
                          <SelectItem value="00:15">00:15</SelectItem>
                          <SelectItem value="00:20">00:20</SelectItem>
                          <SelectItem value="00:25">00:25</SelectItem>
                          <SelectItem value="00:30">00:30</SelectItem>
                          <SelectItem value="00:35">00:35</SelectItem>
                          <SelectItem value="00:40">00:40</SelectItem>
                          <SelectItem value="00:45">00:45</SelectItem>
                          <SelectItem value="00:50">00:50</SelectItem>
                          <SelectItem value="00:55">00:55</SelectItem>
                          <SelectItem value="01:00">01:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="broadcast" className="flex-1" onClick={() => setIsAdConfigOpen(false)}>
                        Save Configuration
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setIsAdConfigOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="control" size="sm" className="w-full justify-start">
                <Copy className="h-4 w-4 mr-2" />
                Copy to Tomorrow
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Repeat Weekly
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Geo Override
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live Programs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span className="text-sm text-muted-foreground">Finished Programs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-300 rounded"></div>
                <span className="text-sm text-muted-foreground">Upcoming Programs</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Schedule Grid */}
        <div className="col-span-9">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Card className="bg-card-dark border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Program Schedule - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-control-surface border-border text-foreground w-40"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      24-hour view
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Time Slots */}
                  <div className="grid grid-cols-1 gap-1">
                    {timeSlots.map((time, index) => (
                      <div key={time} className="relative">
                        <div className="flex items-center gap-4 py-2 border-b border-border/30">
                          <div className="w-16 text-xs text-muted-foreground font-mono">
                            {time}
                          </div>
                          <div className="flex-1 min-h-[60px] relative">
                            {/* Drop zone for scheduling */}
                            <div className="absolute inset-0 border-2 border-dashed border-transparent hover:border-broadcast-blue/50 rounded transition-colors">
                              {/* Ad Break markers every 30 minutes */}
                              {time.endsWith('30') && (
                                <div className="absolute -left-2 top-2 w-2 h-2 bg-[#F68537] rounded-full"></div>
                              )}
                              {/* Scheduled blocks */}
                              {scheduleBlocks
                                .filter(block => block.time === time)
                                .map(block => (
                                   <div
                                     key={block.id}
                                     className={`
                                       p-3 rounded border-2 cursor-pointer transition-all
                                       ${getBlockColor(block.time, block.status)}
                                     `}
                                    style={{ 
                                      height: `${Math.max(120, block.duration / 30 * 30)}px` 
                                    }}
                                    data-block-id={block.id}
                                  >
                                     <div className="flex items-center justify-between mb-2">
                                       <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {block.isEditing ? (
                                          <Input
                                            value={block.title}
                                            onChange={(e) => setScheduleBlocks(prev => 
                                              prev.map(b => b.id === block.id ? { ...b, title: e.target.value } : b)
                                            )}
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
                                           {block.tags.slice(0, 1).map((tag, idx) => (
                                            <div key={idx} className="relative group">
                                               <span className={`text-xs px-1 py-0.5 rounded cursor-pointer ${
                                                 block.status === 'completed' 
                                                   ? 'bg-black/10 text-black' 
                                                   : 'bg-black/30 text-white'
                                               }`}>
                                                {tag}
                                                {editingGenres === block.id && (
                                                  <button
                                                    onClick={() => removeGenreFromBlock(block.id, tag)}
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
                                                  .filter(genre => !block.tags.includes(genre))
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
                                      <div className="flex items-center gap-1">
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
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </DndContext>
        </div>
      </div>
    </div>
  );
};