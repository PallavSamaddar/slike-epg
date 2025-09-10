import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Plus, Calendar, Clock, MapPin, Tag, Copy, RotateCcw, Settings, Edit, Trash2, GripVertical, X, MoreVertical, Play, Pause, SkipBack, SkipForward, Eye, Search, ChevronDown, Save, Flag } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ManageAdsModal } from '@/components/ManageAdsModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DraggableVideo = memo(({ video, blockId, blockTime, onDeleteVideo, dndId, isInCurrentBlock }: { 
  video: Video; 
  blockId: string; 
  blockTime: string;
  onDeleteVideo: (videoId: string) => void;
  dndId?: string;
  isInCurrentBlock?: boolean;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: dndId ?? `${blockId}-${video.id}`,
    data: { video, blockId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine text color based on block time
  const getTextColor = () => {
    return isInCurrentBlock ? 'text-white' : 'text-black';
  };

  const handleDelete = useCallback(() => {
    onDeleteVideo(video.id);
  }, [onDeleteVideo, video.id]);

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
          <span className={`flex-1 truncate ${getTextColor()}`}>{video.name}</span>
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
});

// Sortable Video Item Component for Program Settings Modal
const SortableVideoItem = ({ video, index }: { video: Video; index: number }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-control-surface border border-border rounded-lg hover:bg-control-surface/80 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-broadcast-blue text-white rounded-full flex items-center justify-center text-xs font-medium">
          {index}
        </div>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/10 rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">
          {video.name}
        </div>
        <div className="text-xs text-muted-foreground">
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
      </div>
    </div>
  );
};

export const EPGScheduler = ({ onNavigate }: { onNavigate?: (view: string) => void }) => {
  const { toast } = useToast();
  const formatLocalDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(formatLocalDateKey(new Date()));
  const [selectedChannel, setSelectedChannel] = useState('Fast Channel 1');
  // Continuous 15-day view state/refs
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const continuousContainerRef = useRef<HTMLDivElement | null>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [isSidebarFloating, setIsSidebarFloating] = useState(false);
  const [startDay, setStartDay] = useState<Date>(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
  // Progressive loading states
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isChunkLoading, setIsChunkLoading] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isAdConfigOpen, setIsAdConfigOpen] = useState(false);
  const [editingGenres, setEditingGenres] = useState<string | null>(null);
  const [isManageAdsModalOpen, setIsManageAdsModalOpen] = useState(false);
  const [hasScheduleChanges, setHasScheduleChanges] = useState(false);
  // Map of ISO date -> array of ad markers for that date
  const [adMarkersByDate, setAdMarkersByDate] = useState<Record<string, Array<{ time: string; campaign: string; duration: string; type?: string }>>>({});
  // Program settings modal state
  const [isProgramSettingsOpen, setIsProgramSettingsOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ScheduleBlock | null>(null);
  const [programVideos, setProgramVideos] = useState<Video[]>([]);
  const [originalProgramVideos, setOriginalProgramVideos] = useState<Video[]>([]);
  const [hasProgramChanges, setHasProgramChanges] = useState(false);
  
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

  // Load saved day schedule from Preview, if present
  useEffect(() => {
    try {
      const key = `epg:preview:day:${selectedDate}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const items: { id: string; time: string; title: string; type: 'VOD' | 'Event'; duration: number; status: string; genre: string; }[] = JSON.parse(raw);
        // Map preview items to schedule blocks for the times that exist
        setScheduleBlocks(prev => {
          const byTime = new Map(prev.map(b => [b.time, b]));
          items.forEach(item => {
            const time = item.time.split('T')[1].slice(0,5);
            const block = byTime.get(time);
            if (block) {
              block.title = item.title;
              block.type = item.type;
              block.status = item.status as any;
              block.tags = [item.genre];
            }
          });
          return [...byTime.values()];
        });
      }
    } catch {}
  }, [selectedDate]);

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

  // Memoize heavy arrays
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Single-day grid removed; positions calc no longer needed

  const sortedBlockIdsByTime = useMemo(() => {
    const parseMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map((n) => parseInt(n, 10));
      return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
    };
    return [...scheduleBlocks]
      .sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time))
      .map((b) => b.id);
  }, [scheduleBlocks]);

  const isCurrentBlock = useCallback((dayKey: string, blockId: string) => {
    const todayKey = formatLocalDateKey(new Date());
    if (dayKey !== todayKey) return false;
    const index = sortedBlockIdsByTime.indexOf(blockId);
    return index === 2; // current -> green
  }, [sortedBlockIdsByTime]);

  const getBlockColorForDay = (dayKey: string, blockId: string) => {
    const todayKey = formatLocalDateKey(new Date());
    const dulledGray = 'bg-gray-200 text-black border border-gray-200';
    const green = 'border-2 bg-[#ACC572] text-white border-[#ACC572]';

    // Future days: all gray (dulled)
    if (dayKey !== todayKey) return dulledGray;

    const index = sortedBlockIdsByTime.indexOf(blockId);
    if (index <= 1) return 'bg-white text-black'; // ended -> white
    if (index === 2) return green; // current -> green
    return dulledGray; // upcoming -> dulled gray
  };

  // Build 15-day range from today
  const getDaysArray = (startDate: Date, numberOfDays: number) => {
    const days: { date: Date; key: string; label: string }[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = formatLocalDateKey(d);
      const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' });
      days.push({ date: d, key, label });
    }
    return days;
  };
  // Visible days (start with 3, progressively load up to 15)
  const [visibleDays, setVisibleDays] = useState<{ date: Date; key: string; label: string }[]>(() => getDaysArray(startDay, 3));

  // Simulate initial fetch
  useEffect(() => {
    setIsInitialLoading(true);
    const t = window.setTimeout(() => setIsInitialLoading(false), 300);
    return () => window.clearTimeout(t);
  }, []);

  const getNextDays = useCallback((current: { date: Date; key: string; label: string }[]) => {
    const maxDays = 15;
    if (current.length >= maxDays) return [] as { date: Date; key: string; label: string }[];
    const last = current[current.length - 1];
    const base = new Date(last.date);
    base.setDate(base.getDate() + 1);
    // Load 2 days at a time, but cap at 15
    const remaining = maxDays - current.length;
    const count = Math.min(2, remaining);
    return getDaysArray(base, count);
  }, []);

  const loadMoreDays = useCallback((newDays: { date: Date; key: string; label: string }[]) => {
    if (newDays.length === 0) return;
    setIsChunkLoading(true);
    // Simulate incremental fetch
    window.setTimeout(() => {
      setVisibleDays(prev => [...prev, ...newDays]);
      setIsChunkLoading(false);
    }, 250);
  }, []);

  // Scroll container handler: update selectedDate/head as you scroll
  const handleContinuousScroll = () => {
    if (!continuousContainerRef.current) return;
    const top = continuousContainerRef.current.getBoundingClientRect().top;
    let closest = 0;
    let minDist = Infinity;
    dayRefs.current.forEach((el, idx) => {
      if (!el) return;
      const dist = Math.abs(el.getBoundingClientRect().top - top);
      if (dist < minDist) { minDist = dist; closest = idx; }
    });
    if (closest !== currentDayIndex) {
      setCurrentDayIndex(closest);
      const dayKey = visibleDays[closest]?.key;
      setSelectedDate(dayKey);
      setIsSidebarFloating(closest > 0);
    }
  };

  // Debounce scroll handler to avoid excessive state updates
  const scrollTimeout = useRef<number | null>(null);
  const onScrollDebounced = useCallback(() => {
    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = window.setTimeout(() => {
      handleContinuousScroll();
    }, 50);
  }, [handleContinuousScroll]);

  // Intersection observer to append next days as user scrolls near end
  useEffect(() => {
    if (!continuousContainerRef.current || !loadMoreRef.current) return;
    const rootEl = continuousContainerRef.current;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isChunkLoading && !isInitialLoading) {
        const next = getNextDays(visibleDays);
        if (next.length > 0) {
          loadMoreDays(next);
        }
      }
    }, { root: rootEl, rootMargin: '200px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleDays, isChunkLoading, isInitialLoading, getNextDays, loadMoreDays]);

  // Smooth scroll to a specific day key and highlight first slot briefly
  const scrollToDate = (isoDate: string) => {
    const idx = visibleDays.findIndex(d => d.key === isoDate);
    if (idx >= 0) {
      setCurrentDayIndex(idx);
      setTimeout(() => {
        dayRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedKey(isoDate);
        setTimeout(() => setHighlightedKey(null), 1200);
      }, 0);
      setIsSidebarFloating(idx > 0);
    }
  };

  const formatIso = (d: Date) => d.toISOString().split('T')[0];

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
            targetBlock.videos = [...targetBlock.videos, { ...video, id: `${video.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }];
          }
          
          return newBlocks;
        });
        setHasScheduleChanges(true);
      }
    }
    // If reordering within the same block
    else if (activeData?.blockId === overData?.blockId) {
      const blockId = activeData?.blockId;
      const activeVideoId = active.id.toString().split('-').pop();
      const overVideoId = over.id.toString().split('-').pop();
      
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
        setHasScheduleChanges(true);
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

  // Program settings modal functions
  const openProgramSettings = (block: ScheduleBlock) => {
    setSelectedProgram(block);
    const videos = [...block.videos];
    setProgramVideos(videos);
    setOriginalProgramVideos(videos);
    setHasProgramChanges(false);
    setIsProgramSettingsOpen(true);
  };

  const closeProgramSettings = () => {
    setIsProgramSettingsOpen(false);
    setSelectedProgram(null);
    setProgramVideos([]);
    setOriginalProgramVideos([]);
    setHasProgramChanges(false);
  };

  const saveProgramVideos = () => {
    if (selectedProgram) {
      setScheduleBlocks(prev => 
        prev.map(block => 
          block.id === selectedProgram.id 
            ? { ...block, videos: programVideos }
            : block
        )
      );
      setHasScheduleChanges(true);
    }
    closeProgramSettings();
  };

  const handleVideoReorder = (activeId: string, overId: string) => {
    if (activeId !== overId) {
      setProgramVideos(prev => {
        const oldIndex = prev.findIndex(v => v.id === activeId);
        const newIndex = prev.findIndex(v => v.id === overId);
        const newVideos = arrayMove(prev, oldIndex, newIndex);
        
        // Check if the order has changed
        const hasChanged = newVideos.some((video, index) => 
          originalProgramVideos[index]?.id !== video.id
        );
        setHasProgramChanges(hasChanged);
        
        return newVideos;
      });
    }
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

  // Get the last orange card's end time
  const getLastOrangeCardEndTime = () => {
    const orangeBlocks = scheduleBlocks.filter(block => 
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
    const newId = (scheduleBlocks.length + 1).toString();
    
    const newBlock: ScheduleBlock = {
      id: newId,
      time: newStartTime,
      duration: 60,
      title: 'New Program',
      type: 'VOD',
      status: 'scheduled',
      geoZone: 'Global',
      tags: [],
      description: '',
      videos: []
    };
    
    setScheduleBlocks(prev => [...prev, newBlock]);
  };

  // Handler for Manage Ads modal
  const handleManageAdsSave = (adConfig: Record<string, unknown>) => {
    // adConfig: { campaign: string; duration: string; frequency: string }
    try {
      const { campaign, duration, frequency } = adConfig as { campaign: string; duration: string; frequency: string };
      // Frequency formats like "00:30hr", "1:00hr" etc.
      // Compute marker times for the current selectedDate from 00:00 to 24:00.
      const [freqHourStr, freqMinStrWithHr] = frequency.split(':');
      const freqHours = parseInt(freqHourStr, 10) || 0;
      const freqMinutes = parseInt((freqMinStrWithHr || '0').replace(/hr/i, ''), 10) || 0;
      let stepMinutes = freqHours * 60 + freqMinutes;
      if (!stepMinutes || stepMinutes <= 0) {
        stepMinutes = 30; // default fallback to 30 minutes
      }

      const markers: Array<{ time: string; campaign: string; duration: string; type?: string }> = [];
      let minutes = 0;
      // Avoid infinite loop on bad input
      const maxIterations = 24 * 60 + 1;
      let iter = 0;
      while (minutes < 24 * 60 && iter < maxIterations && stepMinutes > 0) {
        const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
        const mm = (minutes % 60).toString().padStart(2, '0');
        markers.push({ time: `${hh}:${mm}`, campaign, duration });
        minutes += stepMinutes;
        iter += 1;
      }

      setAdMarkersByDate(prev => ({
        ...prev,
        [formatLocalDateKey(new Date(selectedDate))]: markers,
      }));
      toast({
        title: 'Ads scheduled',
        description: `${markers.length} ad marker${markers.length === 1 ? '' : 's'} added on ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}.`,
      });
    } catch (e) {
      console.error('Error computing ad markers', e);
    }
    setIsManageAdsModalOpen(false);
  };

  // Handler for navigation to EPG Preview
  const handleNavigateToEPGPreview = () => {
    if (onNavigate) {
      onNavigate('preview');
    }
  };

  const AddBlockDialog = ({ type }: { type: 'VOD' | 'Event' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const defaultStartTime = type === 'VOD' ? getLastOrangeCardEndTime() : '02:00';

    const handleAddToSchedule = () => {
      if (type === 'VOD') {
        addBlankOrangeCard();
      }
      setIsOpen(false);
    };

    const handleCancel = () => {
      setIsOpen(false);
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={type === 'Event' ? 'live' : 'playlist'} 
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {type} Block
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
                  defaultValue={defaultStartTime}
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
              <Button variant="broadcast" className="flex-1" onClick={handleAddToSchedule}>
                Add to Schedule
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="grid grid-cols-10 gap-6 mb-6">
        <div className="col-span-10">
          <div>
            <div className="flex items-center justify-between mt-2 pr-[320px]">
              <div className="flex items-start gap-8">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>On Air: Morning News Live</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start Time: 02:00 | End Time: 03:00
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
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  max={(function(){ const d = new Date(); d.setDate(d.getDate()+14); return d.toISOString().split('T')[0]; })()}
                  onChange={(e) => { const key = formatLocalDateKey(new Date(e.target.value)); setSelectedDate(key); scrollToDate(key); }}
                  className="bg-control-surface border-border text-foreground w-40"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManageAdsModalOpen(true)}
                  className="bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ads
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasScheduleChanges}
                  onClick={() => {
                    toast({
                      title: 'EPG saved',
                      description: `Schedule for ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} saved successfully.`,
                    });
                    setHasScheduleChanges(false);
                  }}
                  className="bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>

      

      <div className="grid grid-cols-10 gap-8 items-start">
        <div className="col-span-8 overflow-x-auto">
          {/* Continuous 15-day stacked view (progressive load) */}
          <Card className="bg-card-dark border-border mt-6 w-[95%] mx-auto relative">
            <CardContent className="p-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Fullscreen loader on first load */}
                {isInitialLoading && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-broadcast-blue rounded-full animate-spin"></div>
                    <p className="mt-3 text-sm text-muted-foreground">Loading Event EPG…</p>
                  </div>
                )}
                <div ref={continuousContainerRef} className="h-[75vh] overflow-y-auto" onScroll={onScrollDebounced}>
                  {visibleDays.map((day, idx) => (
                    <div key={day.key} ref={el => (dayRefs.current[idx] = el)} className="border-t border-border/30">
                      <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm font-medium">Schedule - {day.label}</span>
        </div>
                      <div className="relative">
                        {timeSlots.map((time) => (
                          <div key={`${day.key}-${time}`} className="flex items-center gap-4 py-2 border-b border-border/30 px-4">
                            <div className="w-16 text-xs text-muted-foreground font-mono">{time}</div>
                            {/* Ad flags next to time label */}
                            {adMarkersByDate[day.key]?.some(m => m.time === time) ? (
                              <div className="w-8 relative z-50 flex items-center justify-center">
                                {adMarkersByDate[day.key]
                                  .filter(m => m.time === time)
                                  .map((m, idx) => (
                                    <TooltipProvider key={`${day.key}-${time}-ad-left-${idx}`}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Flag className="h-5 w-5 text-yellow-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-xs">
                                            <div><span className="font-semibold">Campaign:</span> {m.campaign}</div>
                                            <div><span className="font-semibold">Duration:</span> {m.duration}</div>
                                            {m.type && <div><span className="font-semibold">Type:</span> {m.type}</div>}
                                            <div><span className="font-semibold">Time:</span> {m.time}</div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                              </div>
                            ) : (
                              <div className="w-8" />
                            )}
                            <div 
                              className="flex-1 min-h-[60px] relative"
                              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const data = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                                if (data) {
                                  try {
                                    const draggedData = JSON.parse(data);
                                    if (draggedData.type === 'content-video') {
                                      const targetBlock = scheduleBlocks.find(block => block.time === time);
                                      if (targetBlock) {
                                        setScheduleBlocks(prev =>
                                          prev.map(block =>
                                            block.id === targetBlock.id
                                              ? { ...block, videos: [...block.videos, { ...draggedData.video, id: `${draggedData.video.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }] }
                                              : block
                                          )
                                        );
                                        setHasScheduleChanges(true);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error parsing dragged data:', error);
                                  }
                                }
                              }}
                            >
                              {/* Drop zone for scheduling from right sidebar (wraps blocks so drop bubbles) */}
                              <div
                                className="absolute inset-0 border-2 border-dashed border-transparent hover:border-broadcast-blue/50 rounded transition-colors"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const json = e.dataTransfer.getData('application/json');
                                  if (json) {
                                    try {
                                      const draggedData = JSON.parse(json);
                                      if (draggedData.type === 'content-video') {
                                        const targetBlock = scheduleBlocks.find(block => block.time === time);
                                        if (targetBlock) {
                                          setScheduleBlocks(prev =>
                                            prev.map(block =>
                                              block.id === targetBlock.id
                                                ? { ...block, videos: [...block.videos, { ...draggedData.video, id: `${draggedData.video.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }] }
                                                : block
                                            )
                                          );
                                          setHasScheduleChanges(true);
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error parsing dragged data:', error);
                                    }
                                  }
                                }}
                              >
                                {/* Scheduled blocks with full UI */}
                                {scheduleBlocks
                                  .filter(block => block.time === time && block.title !== 'Ad Break')
                                  .map((block, bi) => (
                                    <div
                                      key={`${day.key}-${block.id}`}
                                      className={`p-3 rounded cursor-pointer transition-colors duration-200 hover:shadow-lg hover:scale-[1.02] relative z-10 ${getBlockColorForDay(day.key, block.id)} ${(highlightedKey === day.key && bi === 0) ? 'ring-2 ring-broadcast-blue' : ''}`}
                                      style={{ minHeight: `${Math.max(120, block.duration * 2)}px` }}
                                      data-block-id={block.id}
                                    >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {block.isEditing ? (
                                          <Input
                                            value={block.title}
                                            onChange={(e) => setScheduleBlocks(prev => prev.map(b => b.id === block.id ? { ...b, title: e.target.value } : b))}
                                            onBlur={() => updateBlockTitle(block.id, block.title)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { updateBlockTitle(block.id, block.title); }}}
                                            className={`text-sm font-medium bg-white/20 ${isCurrentBlock(day.key, block.id) ? 'text-white placeholder:text-white/80' : 'bg-white/90 text-black'} border-none h-6 px-1`}
                                            autoFocus
                                          />
                                        ) : (
                                          <span className={`font-medium text-sm truncate ${isCurrentBlock(day.key, block.id) ? 'text-white' : 'text-black'}`}>
                                            {block.title}
                                          </span>
                                        )}
                                        <button
                                          onClick={() => toggleEditMode(block.id)}
                                          className={`flex-shrink-0 p-1 rounded hover:bg-black/20 ${isCurrentBlock(day.key, block.id) ? 'text-white' : 'text-black'}`}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </button>
                                        <div className="flex gap-1 ml-2 relative">
                                          {block.tags.slice(0, 1).map((tag, idx) => (
                                            <div key={idx} className="relative group">
                                              <span className={`text-xs px-1 py-0.5 rounded cursor-pointer ${isCurrentBlock(day.key, block.id) ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                                                {tag}
                                                {editingGenres === block.id && (
                                                  <button
                                                    onClick={() => removeGenreFromBlock(block.id, tag)}
                                                    className="ml-1 text-red-600 hover:text-red-500"
                                                  >
                                                    <X className="h-2 w-2" />
                                                  </button>
                                                )}
                                              </span>
                                            </div>
                                          ))}
                                          <button
                                            onClick={() => toggleGenreEdit(block.id)}
                                            className={`text-xs px-1 py-0.5 rounded hover:bg-black/20 ${isCurrentBlock(day.key, block.id) ? 'text-white' : 'text-black'}`}
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
                                        <Badge className={`text-xs ${isCurrentBlock(day.key, block.id) ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>{block.type}</Badge>
                                        <button
                                          onClick={() => openProgramSettings(block)}
                                          className={`p-1 rounded hover:bg-black/20 transition-colors ${isCurrentBlock(day.key, block.id) ? 'text-white' : 'text-black'}`}
                                          title="Program Settings"
                                        >
                                          <Settings className="h-3 w-3" />
                                        </button>
                                        {block.status === 'live' && (
                                          <div className="w-2 h-2 bg-pcr-live-glow rounded-full animate-pulse-live"></div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-3">
                                      <div className="flex-1">
                                        <SortableContext items={block.videos.map(v => `${day.key}-${block.id}-${v.id}`)} strategy={verticalListSortingStrategy}>
                                          <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {block.videos.map(video => (
                                              <DraggableVideo
                                                key={video.id}
                                                video={video}
                                                blockId={block.id}
                                                blockTime={block.time}
                                                onDeleteVideo={(videoId) => deleteVideoFromBlock(block.id, videoId)}
                                                dndId={`${day.key}-${block.id}-${video.id}`}
                                                isInCurrentBlock={isCurrentBlock(day.key, block.id)}
                                              />
                                            ))}
                                          </div>
                                        </SortableContext>
                                      </div>
                                      <div className="flex-shrink-0 text-right"></div>
                                    </div>
                                    </div>
                                  ))}
                              </div>
                          </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Skeleton while fetching next chunk */}
                  {isChunkLoading && (
                    <div className="p-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-md mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"></div>
                      ))}
                    </div>
                  )}
                  {/* Sentinel for intersection observer */}
                  <div ref={loadMoreRef} style={{ height: 1 }} />
                </div>
              </DndContext>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-2 self-start mt-2">
          {/* Channel Preview moved into floating sidebar */}
          <Card className="bg-card-dark border-border w-full">
            <CardContent className="pt-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg group">
                <img 
                  src="/toi_global_poster.png" 
                  alt="TOI Global Channel" 
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
          <Card className="bg-card-dark border-border w-full">
            <CardHeader className="pb-3">
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
                              const payload = JSON.stringify({ type: 'content-video', video });
                              e.dataTransfer.setData('application/json', payload);
                              e.dataTransfer.setData('text/plain', payload);
                              try { e.dataTransfer.effectAllowed = 'copy'; } catch {}
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
                              const payload = JSON.stringify({ type: 'content-video', video: recording });
                              e.dataTransfer.setData('application/json', payload);
                              e.dataTransfer.setData('text/plain', payload);
                              try { e.dataTransfer.effectAllowed = 'copy'; } catch {}
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
                              const payload = JSON.stringify({ type: 'content-video', video: liveEvent });
                              e.dataTransfer.setData('application/json', payload);
                              e.dataTransfer.setData('text/plain', payload);
                              try { e.dataTransfer.effectAllowed = 'copy'; } catch {}
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
                              const payload = JSON.stringify({ type: 'content-video', video: youtubeVideo });
                              e.dataTransfer.setData('application/json', payload);
                              e.dataTransfer.setData('text/plain', payload);
                              try { e.dataTransfer.effectAllowed = 'copy'; } catch {}
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

          {/* Actions card removed per request */}
        </div>
      </div>
      <Toaster />

      {/* Manage Ads Modal */}
      <ManageAdsModal
        isOpen={isManageAdsModalOpen}
        onClose={() => setIsManageAdsModalOpen(false)}
        onSave={handleManageAdsSave}
      />

      {/* Program Settings Modal */}
      <Dialog open={isProgramSettingsOpen} onOpenChange={setIsProgramSettingsOpen}>
        <DialogContent className="bg-card-dark border-border max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-foreground text-lg">
              {selectedProgram?.title} - Program Settings
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total Videos: {programVideos.length}</span>
              <span>Total Duration: {programVideos.reduce((total, video) => total + video.duration, 0)}m</span>
              <span>Playlist: Default Playlist</span>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (active && over && active.id !== over.id) {
                  handleVideoReorder(active.id as string, over.id as string);
                }
              }}
            >
              <SortableContext items={programVideos.map(v => v.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 p-1">
                  {programVideos.map((video, index) => (
                    <SortableVideoItem
                      key={video.id}
                      video={video}
                      index={index + 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t border-border bg-card-dark">
            <Button
              variant="ghost"
              onClick={closeProgramSettings}
              className="text-gray-700 hover:bg-gray-100 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={saveProgramVideos}
              disabled={!hasProgramChanges}
              className="bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};