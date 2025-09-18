import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Settings, 
  Save, 
  X, 
  ChevronDown, 
  ChevronRight,
  Search, 
  Eye, 
  GripVertical, 
  Plus,
  Video,
  Radio,
  Youtube,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Video {
  id: string;
  name: string;
  duration: number;
  type?: 'VOD' | 'Event' | 'Live' | 'YouTube';
  playlistName?: string;
  source?: 'playlist' | 'custom';
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
  playlist?: string;
  playlistId?: string;
  defaultPlaylistContent?: Video[];
}

interface ProgramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (program: ScheduleBlock, videos: Video[]) => void;
  onDelete?: (program: ScheduleBlock) => void;
  program: ScheduleBlock | null;
  hasUnsavedChanges: boolean;
  onUnsavedClose: () => void;
}

// Utility functions for deep comparison and state management
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 === 'object') {
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    return true;
  }
  
  return obj1 === obj2;
};

const createStateSnapshot = (program: ScheduleBlock, videos: Video[]) => ({
  program: {
    id: program.id,
    title: program.title,
    type: program.type,
    description: program.description,
    playlist: program.playlist,
    geoZone: program.geoZone,
    tags: [...program.tags]
  },
  videos: videos.map(v => ({
    id: v.id,
    name: v.name,
    duration: v.duration,
    type: v.type
  }))
});

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const formatAbsoluteTime = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Dirty State Badge Component
const DirtyStateBadge = ({ isDirty, lastSaved }: { isDirty: boolean; lastSaved: Date | null }) => {
  const [relativeTime, setRelativeTime] = useState(lastSaved ? formatRelativeTime(lastSaved) : '');
  
  useEffect(() => {
    if (!lastSaved) return;
    
    const updateTime = () => {
      setRelativeTime(formatRelativeTime(lastSaved));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [lastSaved]);
  
  if (isDirty) {
    return (
      <span 
        id="ps-status-badge" 
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"
        aria-live="polite"
      >
        <AlertCircle className="h-3 w-3" />
        Unsaved
      </span>
    );
  }
  
  return (
    <span 
      id="ps-status-badge" 
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border border-green-200"
      aria-live="polite"
    >
      <CheckCircle className="h-3 w-3" />
      Saved
      {lastSaved && (
        <span className="ml-1 text-xs opacity-75">
          {relativeTime}
        </span>
      )}
    </span>
  );
};

// Sortable Playlist Item Component
const SortablePlaylistItem = ({ 
  id, 
  children, 
  isChannelPlaylist = false 
}: { 
  id: string; 
  children: React.ReactNode;
  isChannelPlaylist?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isChannelPlaylist // Disable dragging for channel playlist
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children}
    </div>
  );
};

// Sortable Video Item Component
const SortableVideoItem = ({ video, index, onDelete, group, isInvalidTarget }: { 
  video: Video; 
  index: number;
  onDelete: (videoId: string) => void;
  group: 'custom' | 'playlist';
  isInvalidTarget?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'VOD': return <Video className="h-4 w-4" />;
      case 'Event': return <Radio className="h-4 w-4" />;
      case 'Live': return <Radio className="h-4 w-4" />;
      case 'YouTube': return <Youtube className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'VOD': return 'bg-blue-100 text-blue-800';
      case 'Event': return 'bg-green-100 text-green-800';
      case 'Live': return 'bg-red-100 text-red-800';
      case 'YouTube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatchText = (video: Video) => {
    if (video.source === 'playlist' && video.playlistName) {
      return `${video.type || 'VOD'} - Playlist: ${video.playlistName}`;
    } else if (video.source === 'custom') {
      switch (video.type) {
        case 'VOD': return 'VOD - Custom';
        case 'Event': return 'LiveRec - Custom';
        case 'Live': return 'Live Event - Custom';
        case 'YouTube': return 'YouTube - Custom';
        default: return 'VOD - Custom';
      }
    } else {
      return video.type || 'VOD';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-colors ${
        isInvalidTarget 
          ? 'border-red-300 bg-red-50 hover:bg-red-100' 
          : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
          {index}
        </div>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getTypeIcon(video.type)}
          <div className="font-medium text-sm text-gray-900 truncate">
            {video.name}
          </div>
          <Badge className={`text-xs ${getTypeBadgeColor(video.type)}`}>
            {getBatchText(video)}
          </Badge>
        </div>
        <div className="text-xs text-gray-500">
          Duration: {video.duration}m
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {/* Preview functionality */}}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          onClick={() => onDelete(video.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Add Playlist Modal Component
const AddPlaylistModal = ({ 
  isOpen, 
  onClose, 
  onAddPlaylist 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAddPlaylist: (playlist: {id: string, name: string, videos: Video[]}) => void;
}) => {
  const [playlistType, setPlaylistType] = useState<'new' | 'existing'>('new');
  const [playlistName, setPlaylistName] = useState('');
  const [selectedExistingPlaylist, setSelectedExistingPlaylist] = useState('');

  const existingPlaylists = [
    { id: 'tech', name: 'Tech Reviews' },
    { id: 'sports', name: 'Sports Highlights' },
    { id: 'music', name: 'Music Mix' },
    { id: 'default', name: 'Default Playlist' }
  ];

  const handleAdd = () => {
    if (playlistType === 'new' && playlistName.trim()) {
      onAddPlaylist({
        id: `playlist-${Date.now()}`,
        name: playlistName.trim(),
        videos: []
      });
    } else if (playlistType === 'existing' && selectedExistingPlaylist) {
      const playlist = existingPlaylists.find(p => p.id === selectedExistingPlaylist);
      if (playlist) {
        onAddPlaylist({
          id: playlist.id,
          name: playlist.name,
          videos: [] // Empty initially, user can add content
        });
      }
    }
    onClose();
    setPlaylistName('');
    setSelectedExistingPlaylist('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Playlist Type</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new-playlist"
                  name="playlistType"
                  value="new"
                  checked={playlistType === 'new'}
                  onChange={(e) => setPlaylistType(e.target.value as 'new')}
                />
                <Label htmlFor="new-playlist">New Playlist</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="existing-playlist"
                  name="playlistType"
                  value="existing"
                  checked={playlistType === 'existing'}
                  onChange={(e) => setPlaylistType(e.target.value as 'existing')}
                />
                <Label htmlFor="existing-playlist">Existing Playlist</Label>
              </div>
            </div>
          </div>

          {playlistType === 'new' ? (
            <div>
              <Label htmlFor="playlistName">Playlist Name</Label>
              <Input
                id="playlistName"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="existingPlaylist">Select Playlist</Label>
              <Select value={selectedExistingPlaylist} onValueChange={setSelectedExistingPlaylist}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select existing playlist" />
                </SelectTrigger>
                <SelectContent>
                  {existingPlaylists.map(playlist => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={
              (playlistType === 'new' && !playlistName.trim()) ||
              (playlistType === 'existing' && !selectedExistingPlaylist)
            }
          >
            Add Playlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add Content Panel Component
const AddContentPanel = ({ onAddContent, onAddToPlaylist }: { 
  onAddContent: (content: Video) => void;
  onAddToPlaylist?: (content: Video, playlistId: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragStart = (e: React.DragEvent, content: Video) => {
    const payload = JSON.stringify({ type: 'content-video', video: content });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
    try { e.dataTransfer.effectAllowed = 'copy'; } catch {}
  };

  const mockContent = {
    slikeVideo: [
      { id: 'sv1', name: 'Action Movie Trailer', duration: 3, type: 'VOD' as const },
      { id: 'sv2', name: 'Comedy Special', duration: 25, type: 'VOD' as const },
      { id: 'sv3', name: 'Documentary Clip', duration: 15, type: 'VOD' as const }
    ],
    eventRecording: [
      { id: 'er1', name: 'Sports Match Recording', duration: 90, type: 'Event' as const },
      { id: 'er2', name: 'Concert Performance', duration: 45, type: 'Event' as const },
      { id: 'er3', name: 'Conference Highlights', duration: 30, type: 'Event' as const }
    ],
    liveEvent: [
      { id: 'le1', name: 'Morning News Live', duration: 60, type: 'Live' as const },
      { id: 'le2', name: 'Talk Show Live', duration: 45, type: 'Live' as const },
      { id: 'le3', name: 'Breaking News', duration: 15, type: 'Live' as const }
    ],
    youtube: [
      { id: 'yt1', name: 'Music Video - Artist Name', duration: 4, type: 'YouTube' as const },
      { id: 'yt2', name: 'Tutorial Video', duration: 12, type: 'YouTube' as const },
      { id: 'yt3', name: 'Comedy Sketch', duration: 8, type: 'YouTube' as const }
    ]
  };

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Content</h3>
        
        <Accordion type="single" defaultValue="slike-video" className="w-full">
          <AccordionItem value="slike-video" className="border-gray-200">
            <AccordionTrigger className="text-sm text-gray-700 hover:text-gray-900 [&>svg]:hidden">
              <div className="flex items-center justify-between w-full">
                Slike Video
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by title or video ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-50 border-gray-200 text-gray-900 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockContent.slikeVideo
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(video => (
                    <div 
                      key={video.id} 
                      className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs cursor-grab active:cursor-grabbing hover:bg-gray-200"
                      draggable
                      onDragStart={(e) => handleDragStart(e, video)}
                    >
                      <span className="flex-1 text-gray-900">{video.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{video.duration}m</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (onAddToPlaylist) {
                              // Add to program playlist by default
                              onAddToPlaylist(video, 'program-playlist');
                            } else {
                              onAddContent(video);
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="event-recording" className="border-gray-200">
            <AccordionTrigger className="text-sm text-gray-700 hover:text-gray-900 [&>svg]:hidden">
              <div className="flex items-center justify-between w-full">
                Event Recording
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by title or event ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-50 border-gray-200 text-gray-900 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockContent.eventRecording
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(recording => (
                    <div 
                      key={recording.id} 
                      className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs cursor-grab active:cursor-grabbing hover:bg-gray-200"
                      draggable
                      onDragStart={(e) => handleDragStart(e, recording)}
                    >
                      <span className="flex-1 text-gray-900">{recording.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{recording.duration}m</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            if (onAddToPlaylist) {
                              // Add to program playlist by default
                              onAddToPlaylist(recording, 'program-playlist');
                            } else {
                              onAddContent(recording);
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="live-event" className="border-gray-200">
            <AccordionTrigger className="text-sm text-gray-700 hover:text-gray-900 [&>svg]:hidden">
              <div className="flex items-center justify-between w-full">
                Live Event
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by title or live event ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-gray-50 border-gray-200 text-gray-900 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockContent.liveEvent
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(liveEvent => (
                    <div 
                      key={liveEvent.id} 
                      className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs cursor-grab active:cursor-grabbing hover:bg-gray-200"
                      draggable
                      onDragStart={(e) => handleDragStart(e, liveEvent)}
                    >
                      <span className="flex-1 text-gray-900">{liveEvent.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{liveEvent.duration}m</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onAddContent(liveEvent)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="youtube-url" className="border-gray-200">
            <AccordionTrigger className="text-sm text-gray-700 hover:text-gray-900 [&>svg]:hidden">
              <div className="flex items-center justify-between w-full">
                YouTube URL
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter YouTube URL..." 
                  className="flex-1 bg-gray-50 border-gray-200 text-gray-900 text-sm"
                />
                <Button variant="outline" size="sm">
                  GO
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockContent.youtube
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(youtubeVideo => (
                    <div 
                      key={youtubeVideo.id} 
                      className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs cursor-grab active:cursor-grabbing hover:bg-gray-200"
                      draggable
                      onDragStart={(e) => handleDragStart(e, youtubeVideo)}
                    >
                      <span className="flex-1 text-gray-900">{youtubeVideo.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{youtubeVideo.duration}m</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onAddContent(youtubeVideo)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
    </div>
  );
};

export const ProgramSettingsModal: React.FC<ProgramSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  program,
  hasUnsavedChanges,
  onUnsavedClose
}) => {
  const { toast } = useToast();
  const [localProgram, setLocalProgram] = useState<ScheduleBlock | null>(null);
  const [localVideos, setLocalVideos] = useState<Video[]>([]);
  const [localHasChanges, setLocalHasChanges] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);
  
  // Dirty state management
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [invalidDragTarget, setInvalidDragTarget] = useState<string | null>(null);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [isPlaylistContentExpanded, setIsPlaylistContentExpanded] = useState(false);
  const [isPlaylistContentLoading, setIsPlaylistContentLoading] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProgramPlaylistExpanded, setIsProgramPlaylistExpanded] = useState(false);
  const [isChannelPlaylistExpanded, setIsChannelPlaylistExpanded] = useState(false);
  const [programPlaylistVideos, setProgramPlaylistVideos] = useState<Video[]>([]);
  const [isProgramPlaylistLooping, setIsProgramPlaylistLooping] = useState(false);
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [additionalPlaylists, setAdditionalPlaylists] = useState<Array<{id: string, name: string, videos: Video[], isExpanded: boolean, isLooping: boolean}>>([]);
  const [playlistOrder, setPlaylistOrder] = useState<string[]>(['program-playlist', 'channel-playlist']);
  const ariaLiveRef = useRef<HTMLSpanElement>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Channel Playlist - Dummy content that's the same for all programs
  const channelPlaylistDummyContent: Video[] = [
    { id: 'ch1', name: 'Channel Intro Video', duration: 5, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch2', name: 'News Update - Morning', duration: 3, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch3', name: 'Weather Report', duration: 2, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch4', name: 'Sports Highlights', duration: 8, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch5', name: 'Entertainment News', duration: 4, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch6', name: 'Technology Update', duration: 6, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch7', name: 'Health & Wellness Tips', duration: 5, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch8', name: 'Local Community News', duration: 4, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch9', name: 'Business Update', duration: 3, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch10', name: 'Educational Content', duration: 7, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch11', name: 'Lifestyle Segment', duration: 5, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch12', name: 'Traffic Update', duration: 2, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch13', name: 'Market Analysis', duration: 6, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch14', name: 'Cultural Program', duration: 10, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' },
    { id: 'ch15', name: 'Channel Outro', duration: 3, type: 'VOD', source: 'playlist', playlistName: 'Channel Default' }
  ];

  // Initialize local state when program changes - with lazy loading
  React.useEffect(() => {
    if (program) {
      setIsModalReady(false);
      
      // Use requestAnimationFrame to defer heavy operations
      requestAnimationFrame(() => {
        setLocalProgram({ ...program });
        
        // Initialize videos with proper source and playlist information
        // Separate custom videos and program playlist videos
        const customVideos = program.videos.filter(video => video.source === 'custom').map(video => ({
          ...video,
          source: video.source || 'custom',
          playlistName: video.playlistName || program.playlistId
        }));
        
        // Get program playlist videos (videos that belong to the program's selected playlist)
        const programPlaylistVideos = program.videos.filter(video => 
          video.source === 'playlist' && video.playlistName === program.playlist
        ).map(video => ({
          ...video,
          source: 'playlist' as const,
          playlistName: program.playlist
        }));
        
        setLocalVideos(customVideos);
        setProgramPlaylistVideos(programPlaylistVideos as Video[]);
        setLocalHasChanges(false);
        
        // Reset playlist content state
        setIsPlaylistContentExpanded(false);
        setIsPlaylistContentLoading(false);
        setPlaylistVideos([]);
        
        // Create initial snapshot for dirty state tracking including all playlist states
        const snapshot = {
          program: {
            id: program.id,
            title: program.title,
            type: program.type,
            description: program.description,
            playlist: program.playlist,
            geoZone: program.geoZone,
            tags: [...program.tags]
          },
          videos: customVideos.map(v => ({
            id: v.id,
            name: v.name,
            duration: v.duration,
            type: v.type
          })),
          programPlaylistVideos: programPlaylistVideos.map(v => ({
            id: v.id,
            name: v.name,
            duration: v.duration,
            type: v.type
          })),
          additionalPlaylists: [],
          isProgramPlaylistLooping: false
        };
        setInitialSnapshot(snapshot);
        setIsDirty(false);
        setLastSaved(null);
        
        // Mark modal as ready after data is processed
        setIsModalReady(true);
      });
    }
  }, [program]);

  // Throttled dirty state calculation
  const updateDirtyState = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      if (localProgram && initialSnapshot) {
        // Create comprehensive snapshot including all playlist states
        const currentSnapshot = {
          program: {
            id: localProgram.id,
            title: localProgram.title,
            type: localProgram.type,
            description: localProgram.description,
            playlist: localProgram.playlist,
            geoZone: localProgram.geoZone,
            tags: [...localProgram.tags]
          },
          videos: localVideos.map(v => ({
            id: v.id,
            name: v.name,
            duration: v.duration,
            type: v.type
          })),
          programPlaylistVideos: programPlaylistVideos.map(v => ({
            id: v.id,
            name: v.name,
            duration: v.duration,
            type: v.type
          })),
          additionalPlaylists: additionalPlaylists.map(p => ({
            id: p.id,
            name: p.name,
            videos: p.videos.map(v => ({
              id: v.id,
              name: v.name,
              duration: v.duration,
              type: v.type
            })),
            isLooping: p.isLooping
          })),
          isProgramPlaylistLooping: isProgramPlaylistLooping
        };
        
        const dirty = !deepEqual(currentSnapshot, initialSnapshot);
        setIsDirty(dirty);
        setLocalHasChanges(dirty);
        
        // Update aria-live region
        if (ariaLiveRef.current) {
          ariaLiveRef.current.textContent = dirty 
            ? "Status: Unsaved changes" 
            : "Status: All changes saved";
        }
      }
    }, 150); // 150ms throttle
  }, [localProgram, localVideos, programPlaylistVideos, additionalPlaylists, isProgramPlaylistLooping, initialSnapshot]);

  // Handle playlist content expansion and loading
  const handlePlaylistContentToggle = useCallback(async () => {
    if (isPlaylistContentExpanded) {
      // Collapse
      setIsPlaylistContentExpanded(false);
    } else {
      // Expand and load playlist content
      setIsPlaylistContentExpanded(true);
      
      if (playlistVideos.length === 0) {
        setIsPlaylistContentLoading(true);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load playlist videos from the program's defaultPlaylistContent or existing videos
        const originalPlaylistVideos = program?.defaultPlaylistContent || 
          program?.videos?.filter(video => video.source === 'playlist') || [];
        setPlaylistVideos(originalPlaylistVideos);
        setIsPlaylistContentLoading(false);
      }
    }
  }, [isPlaylistContentExpanded, playlistVideos.length, program]);

  // Handle delete program
  const handleDeleteProgram = useCallback(() => {
    if (program) {
      // Call the onDelete prop if it exists
      if (onDelete) {
        onDelete(program);
      }
      setShowDeleteConfirm(false);
      onClose();
      
      toast({
        title: 'Program deleted',
        description: 'The program has been successfully removed from the EPG.',
      });
    }
  }, [program, onDelete, onClose, toast]);

  // Update dirty state when local state changes
  useEffect(() => {
    updateDirtyState();
  }, [updateDirtyState]);

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleVideoReorder = useCallback((activeId: string, overId: string) => {
    if (activeId !== overId) {
      setLocalVideos(prev => {
        const oldIndex = prev.findIndex(v => v.id === activeId);
        const newIndex = prev.findIndex(v => v.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const activeVideo = prev[oldIndex];
          const overVideo = prev[newIndex];
          
          // Only allow reordering within the same group
          if (activeVideo.source === overVideo.source) {
            const newVideos = arrayMove(prev, oldIndex, newIndex);
            
            // TODO: If reordering playlist videos, update the global playlist order
            // This would require a global state management system to sync across all programs
            // that use the same playlist. For now, changes are local to this program.
            if (activeVideo.source === 'playlist') {
              // Future implementation: Update global playlist order
              // updateGlobalPlaylistOrder(activeVideo.playlistName, newVideos);
            }
            
            return newVideos;
          }
        }
        return prev;
      });
    }
  }, []);

  const handleAddContent = useCallback((content: Video) => {
    const newVideo: Video = {
      ...content,
      id: `${content.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'custom', // All content from RHS is custom
      playlistName: undefined // Custom content doesn't have playlist
    };
    // Insert at index 0 (very top of the list)
    setLocalVideos(prev => [newVideo, ...prev]);
    toast({
      title: 'Content added',
      description: `${content.name} has been added to the program.`,
    });
  }, [toast]);

  const handleAddToPlaylist = useCallback((content: Video, playlistId: string) => {
    const newVideo: Video = {
      ...content,
      id: `${content.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'custom',
      playlistName: undefined
    };

    if (playlistId === 'program-playlist') {
      setProgramPlaylistVideos(prev => [newVideo, ...prev]);
      toast({
        title: 'Content added',
        description: `${content.name} has been added to the program playlist.`,
      });
    } else if (playlistId && playlistId !== 'channel-playlist') {
      setAdditionalPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, videos: [newVideo, ...playlist.videos] }
          : playlist
      ));
      const playlistName = additionalPlaylists.find(p => p.id === playlistId)?.name || 'playlist';
      toast({
        title: 'Content added',
        description: `${content.name} has been added to ${playlistName}.`,
      });
    } else if (playlistId === 'channel-playlist') {
      setPlaylistVideos(prev => [newVideo, ...prev]);
      toast({
        title: 'Content added',
        description: `${content.name} has been added to the channel playlist.`,
      });
    }
  }, [additionalPlaylists, toast]);

  const handleDeleteVideo = useCallback((videoId: string) => {
    // Remove from local videos (custom content)
    setLocalVideos(prev => prev.filter(v => v.id !== videoId));
    
    // Remove from program playlist videos
    setProgramPlaylistVideos(prev => prev.filter(v => v.id !== videoId));
    
    // Remove from additional playlists
    setAdditionalPlaylists(prev => prev.map(playlist => ({
      ...playlist,
      videos: playlist.videos.filter(v => v.id !== videoId)
    })));
    
    // Remove from channel playlist videos
    setPlaylistVideos(prev => prev.filter(v => v.id !== videoId));
  }, []);

  // Handle adding new playlist with accordion behavior
  const handleAddPlaylist = useCallback((playlist: {id: string, name: string, videos: Video[]}) => {
    // Close all other playlists first
    setIsProgramPlaylistExpanded(false);
    setIsChannelPlaylistExpanded(false);
    setAdditionalPlaylists(prev => prev.map(p => ({ ...p, isExpanded: false })));
    
    // Add the new playlist and expand it
    setAdditionalPlaylists(prev => [...prev, {
      ...playlist,
      isExpanded: true,
      isLooping: false
    }]);
    
    // Add the new playlist to the order (before channel-playlist)
    setPlaylistOrder(prev => {
      const newOrder = [...prev];
      const channelIndex = newOrder.indexOf('channel-playlist');
      newOrder.splice(channelIndex, 0, playlist.id);
      return newOrder;
    });
  }, []);

  // Handle program playlist toggle with accordion behavior
  const handleProgramPlaylistToggle = useCallback(async () => {
    if (isProgramPlaylistExpanded) {
      // Collapse
      setIsProgramPlaylistExpanded(false);
    } else {
      // Close all other playlists first
      setIsChannelPlaylistExpanded(false);
      setAdditionalPlaylists(prev => prev.map(playlist => ({ ...playlist, isExpanded: false })));
      
      // Then expand program playlist
      setIsProgramPlaylistExpanded(true);
    }
  }, [isProgramPlaylistExpanded]);

  // Handle channel playlist toggle with accordion behavior
  const handleChannelPlaylistToggle = useCallback(async () => {
    if (isChannelPlaylistExpanded) {
      // Collapse
      setIsChannelPlaylistExpanded(false);
    } else {
      // Close all other playlists first
      setIsProgramPlaylistExpanded(false);
      setAdditionalPlaylists(prev => prev.map(playlist => ({ ...playlist, isExpanded: false })));
      
      // Then expand channel playlist and load content
      setIsChannelPlaylistExpanded(true);
      
      if (playlistVideos.length === 0) {
        setIsPlaylistContentLoading(true);
        
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use the dummy channel playlist content (same for all programs)
        setPlaylistVideos(channelPlaylistDummyContent);
        setIsPlaylistContentLoading(false);
      }
    }
  }, [isChannelPlaylistExpanded, playlistVideos.length, channelPlaylistDummyContent]);

  // Handle additional playlist toggle with accordion behavior
  const handleAdditionalPlaylistToggle = useCallback(async (playlistId: string) => {
    const targetPlaylist = additionalPlaylists.find(p => p.id === playlistId);
    
    if (targetPlaylist?.isExpanded) {
      // Collapse the target playlist
      setAdditionalPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, isExpanded: false }
          : playlist
      ));
    } else {
      // Close all other playlists first
      setIsProgramPlaylistExpanded(false);
      setIsChannelPlaylistExpanded(false);
      setAdditionalPlaylists(prev => prev.map(playlist => ({ ...playlist, isExpanded: false })));
      
      // Then expand the target playlist
      setAdditionalPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, isExpanded: true }
          : playlist
      ));
    }
  }, [additionalPlaylists]);

  // Handle program playlist loop toggle
  const handleProgramPlaylistLoopToggle = useCallback(() => {
    setIsProgramPlaylistLooping(prev => !prev);
  }, []);

  // Handle additional playlist loop toggle
  const handleAdditionalPlaylistLoopToggle = useCallback((playlistId: string) => {
    setAdditionalPlaylists(prev => prev.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, isLooping: !playlist.isLooping }
        : playlist
    ));
  }, []);

  // Handle playlist reordering
  const handlePlaylistReorder = useCallback((activeId: string, overId: string) => {
    if (activeId !== overId) {
      setPlaylistOrder(prev => {
        const oldIndex = prev.findIndex(id => id === activeId);
        const newIndex = prev.findIndex(id => id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Don't allow moving channel-playlist from its last position
          if (activeId === 'channel-playlist' && newIndex < prev.length - 1) {
            toast({
              title: 'Cannot move Channel Playlist',
              description: 'Channel Playlist must remain at the bottom.',
              variant: 'destructive',
            });
            return prev;
          }
          
          // Don't allow moving other playlists to the last position (reserved for channel-playlist)
          if (activeId !== 'channel-playlist' && newIndex === prev.length - 1) {
            toast({
              title: 'Invalid position',
              description: 'This position is reserved for Channel Playlist.',
              variant: 'destructive',
            });
            return prev;
          }
          
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  }, [toast]);

  const handleSave = useCallback(() => {
    if (localProgram) {
      onSave(localProgram, localVideos);
      
      // Reset dirty state and update snapshot with all playlist states
      const newSnapshot = {
        program: {
          id: localProgram.id,
          title: localProgram.title,
          type: localProgram.type,
          description: localProgram.description,
          playlist: localProgram.playlist,
          geoZone: localProgram.geoZone,
          tags: [...localProgram.tags]
        },
        videos: localVideos.map(v => ({
          id: v.id,
          name: v.name,
          duration: v.duration,
          type: v.type
        })),
        programPlaylistVideos: programPlaylistVideos.map(v => ({
          id: v.id,
          name: v.name,
          duration: v.duration,
          type: v.type
        })),
        additionalPlaylists: additionalPlaylists.map(p => ({
          id: p.id,
          name: p.name,
          videos: p.videos.map(v => ({
            id: v.id,
            name: v.name,
            duration: v.duration,
            type: v.type
          })),
          isLooping: p.isLooping
        })),
        isProgramPlaylistLooping: isProgramPlaylistLooping
      };
      setInitialSnapshot(newSnapshot);
      setIsDirty(false);
      setLocalHasChanges(false);
      setLastSaved(new Date());
      
      // Update aria-live region
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = "Program settings saved.";
      }
      
      toast({
        title: 'Program updated',
        description: 'Program settings have been saved successfully.',
      });
    }
  }, [localProgram, localVideos, programPlaylistVideos, additionalPlaylists, isProgramPlaylistLooping, onSave, toast]);

  const handleClose = useCallback(() => {
    if (localHasChanges) {
      // Show confirmation dialog for unsaved changes
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [localHasChanges, onClose]);

  const handleDrop = useCallback((e: React.DragEvent, targetPlaylistId?: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const draggedData = JSON.parse(data);
        if (draggedData.type === 'content-video') {
          const newVideo: Video = {
            ...draggedData.video,
            id: `${draggedData.video.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: 'custom',
            playlistName: undefined
          };

          if (targetPlaylistId === 'program-playlist') {
            // Add to program playlist
            setProgramPlaylistVideos(prev => [newVideo, ...prev]);
            toast({
              title: 'Content added',
              description: `${draggedData.video.name} has been added to the program playlist.`,
            });
          } else if (targetPlaylistId && targetPlaylistId !== 'channel-playlist') {
            // Add to additional playlist
            setAdditionalPlaylists(prev => prev.map(playlist => 
              playlist.id === targetPlaylistId 
                ? { ...playlist, videos: [newVideo, ...playlist.videos] }
                : playlist
            ));
            toast({
              title: 'Content added',
              description: `${draggedData.video.name} has been added to ${additionalPlaylists.find(p => p.id === targetPlaylistId)?.name || 'playlist'}.`,
            });
          } else if (targetPlaylistId === 'channel-playlist') {
            // Add to channel playlist (this might not be desired, but keeping for completeness)
            setPlaylistVideos(prev => [newVideo, ...prev]);
            toast({
              title: 'Content added',
              description: `${draggedData.video.name} has been added to the channel playlist.`,
            });
          } else {
            // Default behavior - add to custom content
            handleAddContent(draggedData.video);
          }
        }
      } catch (error) {
        console.error('Error handling drop:', error);
      }
    }
  }, [handleAddContent, additionalPlaylists, toast]);

  const totalDuration = localVideos.reduce((total, video) => total + video.duration, 0);
  
  // Convert program duration from hours to minutes
  const programDurationMinutes = localProgram ? localProgram.duration * 60 : 0;
  
  // Calculate custom vs playlist video durations
  const customVideosDuration = localVideos
    .filter(video => video.source === 'custom')
    .reduce((total, video) => total + video.duration, 0);
  
  const rawPlaylistVideosDuration = localVideos
    .filter(video => video.source === 'playlist')
    .reduce((total, video) => total + video.duration, 0);
  
  // Limit playlist duration to fit within program duration (minus custom content)
  const availableDurationForPlaylist = Math.max(0, programDurationMinutes - customVideosDuration);
  const playlistVideosDuration = Math.min(rawPlaylistVideosDuration, availableDurationForPlaylist);
  

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Ctrl+S for save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (isDirty) {
          handleSave();
        }
      }
      
      // ESC for close
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, handleSave, handleClose]);

  // Scroll shadow effect
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const lhsScroll = document.getElementById('program-settings-main-scroll');
      const rhsScroll = document.getElementById('program-settings-rhs-scroll');
      
      const lhsScrolled = lhsScroll?.scrollTop && lhsScroll.scrollTop > 0;
      const rhsScrolled = rhsScroll?.scrollTop && rhsScroll.scrollTop > 0;
      
      setIsScrolled(!!(lhsScrolled || rhsScrolled));
    };

    const lhsScroll = document.getElementById('program-settings-main-scroll');
    const rhsScroll = document.getElementById('program-settings-rhs-scroll');
    
    if (lhsScroll) lhsScroll.addEventListener('scroll', handleScroll);
    if (rhsScroll) rhsScroll.addEventListener('scroll', handleScroll);
    
    return () => {
      if (lhsScroll) lhsScroll.removeEventListener('scroll', handleScroll);
      if (rhsScroll) rhsScroll.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  if (!program || !localProgram) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-[1600px] max-h-[95vh] p-0 overflow-hidden">
        {/* Screen reader live region */}
        <span className="sr-only" aria-live="polite" ref={ariaLiveRef} id="ps-status-aria"></span>
        
        {/* Hidden DialogHeader for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>{localProgram.title} — Program Settings</DialogTitle>
        </DialogHeader>
        
        {/* Loading State */}
        {!isModalReady && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Loading program settings...</p>
            </div>
          </div>
        )}
        
        {/* Main Content - Only render when ready */}
        {isModalReady && (
        
        <div className="h-full flex flex-col">
          {/* Sticky modal header with Save/Close */}
          <div className={`sticky top-0 z-30 bg-white border-b border-gray-200 transition-shadow duration-200 ${
            isScrolled ? 'shadow-md' : ''
          }`}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex items-center gap-2">
                <h3 className="text-base font-semibold truncate">
                  {localProgram.title} — Program Settings
                </h3>
                <DirtyStateBadge isDirty={isDirty} lastSaved={lastSaved} />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="shrink-0 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Program
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                >
                  {isDirty ? 'Discard Changes' : 'Close'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 pb-3 text-sm text-gray-600">
              <span><span className="font-bold">Tonight</span> {localProgram.time}–{(() => {
                const [hours, minutes] = localProgram.time.split(':').map(Number);
                const endMinutes = hours * 60 + minutes + localProgram.duration;
                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
              })()} IST</span>
              <span><span className="font-bold">Program Duration:</span> {Math.floor(localProgram.duration / 60)}h {localProgram.duration % 60}m</span>
              <span><span className="font-bold">Total Videos:</span> {localVideos.length}</span>
              <span><span className="font-bold">Total Duration:</span> {totalDuration}m</span>
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Last saved {formatRelativeTime(lastSaved)} · {formatAbsoluteTime(lastSaved)}
                </span>
              )}
            </div>
          </div>

          {/* Split panes fill remaining height */}
          <div className="flex-1 grid grid-cols-[1fr_420px] md:grid-cols-[1fr_360px] sm:grid-cols-1" style={{ height: 'calc(100% - 120px)' }}>
            {/* LHS pane */}
            <section id="program-settings-main" className="flex flex-col h-full min-h-0">
              {/* Optional sticky subheader for LHS */}
              <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Videos</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPlaylistModal(true)}
                    className="h-8"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Playlist
                  </Button>
                </div>
              </div>
              {/* The actual scroll area for LHS */}
              <div id="program-settings-main-scroll" className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>

                {/* Program Form */}
                <div className="space-y-6 min-h-[800px]">
                  {/* Program Content Drop Zone - New Accordion Structure */}
                  <Card className="bg-white border border-gray-200 rounded-lg">
                    <CardContent className="p-0">
                      <div className="min-h-[400px] p-4">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragStart={(event) => {
                            setInvalidDragTarget(null);
                          }}
                          onDragOver={(event) => {
                            const { active, over } = event;
                            if (active && over) {
                              const activeVideo = localVideos.find(v => v.id === active.id);
                              const overVideo = localVideos.find(v => v.id === over.id);
                              
                              // Check if drag is invalid (different groups)
                              if (activeVideo && overVideo && activeVideo.source !== overVideo.source) {
                                setInvalidDragTarget(over.id as string);
                              } else {
                                setInvalidDragTarget(null);
                              }
                            }
                          }}
                          onDragEnd={(event) => {
                            const { active, over } = event;
                            setInvalidDragTarget(null);
                            
                            if (active && over && active.id !== over.id) {
                              // Check if this is a playlist reorder or video reorder
                              const isPlaylistReorder = playlistOrder.includes(active.id as string) && playlistOrder.includes(over.id as string);
                              
                              if (isPlaylistReorder) {
                                handlePlaylistReorder(active.id as string, over.id as string);
                              } else {
                                // Get the source and target video groups
                                const activeVideo = localVideos.find(v => v.id === active.id);
                                const overVideo = localVideos.find(v => v.id === over.id);
                                
                                // Only allow reordering within the same group
                                if (activeVideo && overVideo && activeVideo.source === overVideo.source) {
                                  handleVideoReorder(active.id as string, over.id as string);
                                } else {
                                  // Show feedback for invalid drag
                                  toast({
                                    title: 'Invalid drag operation',
                                    description: 'Videos can only be reordered within their own group.',
                                    variant: 'destructive',
                                  });
                                }
                              }
                            }
                          }}
                        >
                          <SortableContext items={[...playlistOrder, ...localVideos.map(v => v.id)]} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                              {playlistOrder.map((playlistId) => {
                                if (playlistId === 'program-playlist') {
                                  return (
                                    <SortablePlaylistItem key="program-playlist" id="program-playlist">
                                      <div className="space-y-2">
                                        <div 
                                          className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                                          onClick={handleProgramPlaylistToggle}
                                        >
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          <span className="text-sm font-medium text-blue-700">
                                            Playlist: {localProgram?.playlist || 'Default Playlist'}
                                          </span>
                                          <div className="ml-auto flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-blue-600 group"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleProgramPlaylistLoopToggle();
                                      }}
                                    >
                                      <RotateCcw className={`h-4 w-4 ${isProgramPlaylistLooping ? 'text-blue-600 group-hover:text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                    </Button>
                                            {isProgramPlaylistExpanded ? (
                                              <ChevronDown className="h-4 w-4 text-blue-600" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-blue-600" />
                                            )}
                                          </div>
                                        </div>
                                        
                                        {isProgramPlaylistExpanded && (
                                          <div 
                                            className="space-y-2 min-h-[100px] border-2 border-dashed border-transparent hover:border-blue-300 rounded-lg p-2 transition-colors"
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              e.dataTransfer.dropEffect = 'copy';
                                            }}
                                            onDrop={(e) => handleDrop(e, 'program-playlist')}
                                          >
                                            {programPlaylistVideos.length > 0 ? (
                                              programPlaylistVideos.map((video, index) => (
                                                <SortableVideoItem
                                                  key={video.id}
                                                  video={video}
                                                  index={index + 1}
                                                  onDelete={handleDeleteVideo}
                                                  group="playlist"
                                                  isInvalidTarget={invalidDragTarget === video.id}
                                                />
                                              ))
                                            ) : (
                                              <div className="text-center py-8 text-gray-500">
                                                <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p>Drag content from the right panel or click the + button to add content</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </SortablePlaylistItem>
                                  );
                                } else if (playlistId === 'channel-playlist') {
                                  return (
                                    <SortablePlaylistItem key="channel-playlist" id="channel-playlist" isChannelPlaylist={true}>
                                      <div className="space-y-2">
                                        <div 
                                          className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-200 rounded-md cursor-pointer hover:bg-green-100 transition-colors"
                                          onClick={handleChannelPlaylistToggle}
                                        >
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span className="text-sm font-medium text-green-700">Channel Playlist</span>
                                          <div className="ml-auto">
                                            {isPlaylistContentLoading ? (
                                              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                            ) : isChannelPlaylistExpanded ? (
                                              <ChevronDown className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-green-600" />
                                            )}
                                          </div>
                                        </div>
                                        
                                        {isChannelPlaylistExpanded && (
                                          <div 
                                            className="space-y-2 min-h-[100px] border-2 border-dashed border-transparent hover:border-green-300 rounded-lg p-2 transition-colors"
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              e.dataTransfer.dropEffect = 'copy';
                                            }}
                                            onDrop={(e) => handleDrop(e, 'channel-playlist')}
                                          >
                                            {isPlaylistContentLoading ? (
                                              <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                                                <span className="ml-2 text-sm text-gray-600">Loading playlist content...</span>
                                              </div>
                                            ) : playlistVideos.length > 0 ? (
                                              playlistVideos.map((video, index) => (
                                                <SortableVideoItem
                                                  key={video.id}
                                                  video={video}
                                                  index={programPlaylistVideos.length + additionalPlaylists.reduce((acc, p) => acc + p.videos.length, 0) + index + 1}
                                                  onDelete={handleDeleteVideo}
                                                  group="playlist"
                                                  isInvalidTarget={invalidDragTarget === video.id}
                                                />
                                              ))
                                            ) : (
                                              <div className="text-center py-8 text-gray-500">
                                                <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p>Loading channel playlist content...</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </SortablePlaylistItem>
                                  );
                                } else {
                                  // Additional playlists
                                  const playlist = additionalPlaylists.find(p => p.id === playlistId);
                                  if (!playlist) return null;
                                  
                                  return (
                                    <SortablePlaylistItem key={playlist.id} id={playlist.id}>
                                      <div className="space-y-2">
                                        <div 
                                          className="flex items-center gap-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded-md cursor-pointer hover:bg-purple-100 transition-colors"
                                          onClick={() => handleAdditionalPlaylistToggle(playlist.id)}
                                        >
                                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                          <span className="text-sm font-medium text-purple-700">
                                            Playlist: {playlist.name}
                                          </span>
                                          <div className="ml-auto flex items-center gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 hover:bg-purple-600 group"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdditionalPlaylistLoopToggle(playlist.id);
                                              }}
                                            >
                                              <RotateCcw className={`h-4 w-4 ${playlist.isLooping ? 'text-purple-600 group-hover:text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                            </Button>
                                            {playlist.isExpanded ? (
                                              <ChevronDown className="h-4 w-4 text-purple-600" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-purple-600" />
                                            )}
                                          </div>
                                        </div>
                                        
                                        {playlist.isExpanded && (
                                          <div 
                                            className="space-y-2 min-h-[100px] border-2 border-dashed border-transparent hover:border-purple-300 rounded-lg p-2 transition-colors"
                                            onDragOver={(e) => {
                                              e.preventDefault();
                                              e.dataTransfer.dropEffect = 'copy';
                                            }}
                                            onDrop={(e) => handleDrop(e, playlist.id)}
                                          >
                                            {playlist.videos.length > 0 ? (
                                              playlist.videos.map((video, index) => (
                                                <SortableVideoItem
                                                  key={video.id}
                                                  video={video}
                                                  index={programPlaylistVideos.length + additionalPlaylists.findIndex(p => p.id === playlist.id) * 10 + index + 1}
                                                  onDelete={handleDeleteVideo}
                                                  group="playlist"
                                                  isInvalidTarget={invalidDragTarget === video.id}
                                                />
                                              ))
                                            ) : (
                                              <div className="text-center py-8 text-gray-500">
                                                <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p>Drag content from the right panel or click the + button to add content</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </SortablePlaylistItem>
                                  );
                                }
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Settings - Collapsible Container */}
                  <Accordion 
                    type="single" 
                    collapsible 
                    value={isAdvancedSettingsOpen ? "advanced-settings" : ""}
                    onValueChange={(value) => setIsAdvancedSettingsOpen(value === "advanced-settings")}
                    className="w-full"
                  >
                    <AccordionItem value="advanced-settings" className="border-gray-200">
                      <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-gray-900 [&>svg]:hidden">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-gray-500" />
                            <span>Advanced Settings</span>
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-4">
                        {/* Program Details */}
                        <Card className="bg-white border border-gray-200 rounded-lg">
                          <CardHeader>
                            <CardTitle className="text-lg">Program Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="title">Program Title</Label>
                                <Input
                                  id="title"
                                  value={localProgram.title}
                                  onChange={(e) => {
                                    setLocalProgram(prev => prev ? { ...prev, title: e.target.value } : null);
                                  }}
                                  className="bg-white border-gray-200 text-gray-900"
                                />
                              </div>
                              <div>
                                <Label htmlFor="playlist">Playlist</Label>
                                <Select
                                  value={localProgram.playlist || 'Default Playlist'}
                                  onValueChange={(value) => {
                                    setLocalProgram(prev => prev ? { ...prev, playlist: value } : null);
                                  }}
                                >
                                  <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Default Playlist">Default Playlist</SelectItem>
                                    <SelectItem value="Sports Highlights">Sports Highlights</SelectItem>
                                    <SelectItem value="Music Mix">Music Mix</SelectItem>
                                    <SelectItem value="Tech Reviews">Tech Reviews</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={localProgram.description || ''}
                                onChange={(e) => {
                                  setLocalProgram(prev => prev ? { ...prev, description: e.target.value } : null);
                                }}
                                placeholder="Enter program description..."
                                className="bg-white border-gray-200 text-gray-900"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Additional Settings */}
                        <Card className="bg-white border border-gray-200 rounded-lg">
                          <CardHeader>
                            <CardTitle className="text-lg">Additional Settings</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="tags">Tags</Label>
                              <Input
                                id="tags"
                                placeholder="Enter tags separated by commas"
                                className="bg-white border-gray-200 text-gray-900"
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Enter additional notes..."
                                rows={4}
                                className="bg-white border-gray-200 text-gray-900"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select>
                                  <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="category">Category</Label>
                                <Select>
                                  <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="entertainment">Entertainment</SelectItem>
                                    <SelectItem value="news">News</SelectItem>
                                    <SelectItem value="sports">Sports</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Advanced Options */}
                        <Card className="bg-white border border-gray-200 rounded-lg">
                          <CardHeader>
                            <CardTitle className="text-lg">Advanced Options</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Content Restrictions</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="age-restricted" className="rounded" />
                                  <Label htmlFor="age-restricted">Age Restricted Content</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="geo-blocked" className="rounded" />
                                  <Label htmlFor="geo-blocked">Geographic Restrictions</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="time-sensitive" className="rounded" />
                                  <Label htmlFor="time-sensitive">Time Sensitive Content</Label>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="metadata">Custom Metadata</Label>
                              <Textarea
                                id="metadata"
                                placeholder="Enter custom metadata in JSON format..."
                                rows={3}
                                className="bg-white border-gray-200 text-gray-900 font-mono text-sm"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </section>

            {/* RHS pane */}
            <aside id="program-settings-rhs" className="flex flex-col h-full min-h-0 border-l border-gray-200 bg-white">
              <div className="shrink-0 border-b border-gray-200 px-4 py-2">
                <div className="text-sm font-semibold">Add Content</div>
              </div>
              <div id="program-settings-rhs-scroll" className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <AddContentPanel 
              onAddContent={handleAddContent} 
              onAddToPlaylist={handleAddToPlaylist}
            />
              </div>
            </aside>
          </div>
        </div>
        )}
      </DialogContent>

      {/* Add Playlist Modal */}
      <AddPlaylistModal
        isOpen={showAddPlaylistModal}
        onClose={() => setShowAddPlaylistModal(false)}
        onAddPlaylist={handleAddPlaylist}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Program
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this program? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-900">{localProgram?.title}</p>
              <p className="text-xs text-gray-500">
                {localProgram?.time} - {(() => {
                  if (!localProgram) return '';
                  const [hours, minutes] = localProgram.time.split(':').map(Number);
                  const endMinutes = hours * 60 + minutes + localProgram.duration;
                  const endHours = Math.floor(endMinutes / 60);
                  const endMins = endMinutes % 60;
                  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                })()} IST
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProgram}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Program
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
