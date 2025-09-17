import { useState } from 'react';
import { Radio, XCircle, AlertTriangle, AlertCircle, CheckCircle, Clock, Settings, Tv, Play, RotateCcw, Power, Calendar, PlayCircle, Globe, Plus, WifiOff, X, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

interface LiveSource {
  id: string;
  name: string;
  studioId: string;
  status: 'online' | 'offline' | 'warning';
  streamHealth: number;
  bitrate: string;
  resolution: string;
  lastHeartbeat: string;
  currentProgram?: string;
  nextProgram?: string;
  nextProgramTime?: string;
  posterUrl?: string;
  language?: string;
}

interface LiveEvent {
  id: string;
  title: string;
  sourceId: string;
  startTime: string;
  endTime: string;
  status: 'live' | 'upcoming' | 'ending';
  viewerCount?: number;
  priority: 'normal' | 'high' | 'critical';
  tags: string[];
}

interface Props {
  onNavigate?: (view: string) => void;
}

export const LiveEventsManager = ({ onNavigate }: Props) => {
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<LiveSource | null>(null);
  const [feedType, setFeedType] = useState<'input' | 'output'>('output');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [aspectRatio, setAspectRatio] = useState<'Landscape (16:9)' | 'Vertical (9:16)'>('Landscape (16:9)');
  const [primaryGenre, setPrimaryGenre] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<string>('English');
  const [posterWarning, setPosterWarning] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('Default Playlist');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [epgMaster, setEpgMaster] = useState<string>('1 Day');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const channelsPerPage = 8;

  // Dummy campaign data
  const campaignOptions = [
    { id: 'campaign-1', name: 'Summer Campaign', duration: '30s' },
    { id: 'campaign-2', name: 'Tech Launch', duration: '1m' },
    { id: 'campaign-3', name: 'Holiday Special', duration: '1:30m' },
    { id: 'campaign-4', name: 'Brand Awareness', duration: '2:00m' },
    { id: 'campaign-5', name: 'Product Demo', duration: '45s' },
    { id: 'campaign-6', name: 'Event Promo', duration: '1:15m' },
  ];

  const mockSources: LiveSource[] = [
    {
      id: 'studio-1',
      name: 'Fast Channel 1',
      studioId: 'TIL-001',
      status: 'online',
      streamHealth: 98,
      bitrate: '8.5 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '2 seconds ago',
      currentProgram: 'Morning News Live',
      nextProgram: 'Weather Update',
      nextProgramTime: '09:30'
    },
    {
      id: 'studio-2',
      name: 'Fast Channel 2',
      studioId: 'TIL-002',
      status: 'online',
      streamHealth: 95,
      bitrate: '8.2 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '1 second ago',
      currentProgram: 'Breaking News',
      nextProgram: 'Sports Update',
      nextProgramTime: '10:00'
    },
    {
      id: 'studio-3',
      name: 'Fast Channel 3',
      studioId: 'TIL-003',
      status: 'warning',
      streamHealth: 75,
      bitrate: '6.1 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '15 seconds ago',
      currentProgram: 'Sports Highlights',
      nextProgram: 'Talk Show',
      nextProgramTime: '11:00'
    },
    {
      id: 'remote-1',
      name: 'Fast Channel 4',
      studioId: 'REM-001',
      status: 'offline',
      streamHealth: 0,
      bitrate: '0 Mbps',
      resolution: 'N/A',
      lastHeartbeat: '5 minutes ago'
    },
    {
      id: 'studio-4',
      name: 'Fast Channel 5',
      studioId: 'TIL-004',
      status: 'online',
      streamHealth: 92,
      bitrate: '7.8 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '3 seconds ago',
      currentProgram: 'Midday Movies',
      nextProgram: 'News Bulletin',
      nextProgramTime: '12:30'
    },
    {
      id: 'studio-5',
      name: 'Fast Channel 6',
      studioId: 'TIL-005',
      status: 'online',
      streamHealth: 88,
      bitrate: '7.2 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: 'just now',
      currentProgram: 'Classic Hits',
      nextProgram: 'Top Charts',
      nextProgramTime: '13:00'
    },
    {
      id: 'studio-6',
      name: 'Fast Channel 7',
      studioId: 'TIL-006',
      status: 'warning',
      streamHealth: 62,
      bitrate: '5.4 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '25 seconds ago',
      currentProgram: 'Cooking Delight',
      nextProgram: 'Travel Diaries',
      nextProgramTime: '14:15'
    },
    {
      id: 'studio-7',
      name: 'Fast Channel 8',
      studioId: 'TIL-007',
      status: 'online',
      streamHealth: 97,
      bitrate: '8.7 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '1 second ago',
      currentProgram: 'Documentary Now',
      nextProgram: 'Nature Watch',
      nextProgramTime: '15:00'
    },
    {
      id: 'remote-2',
      name: 'Fast Channel 9',
      studioId: 'REM-002',
      status: 'offline',
      streamHealth: 0,
      bitrate: '0 Mbps',
      resolution: 'N/A',
      lastHeartbeat: '10 minutes ago'
    },
    {
      id: 'studio-8',
      name: 'Fast Channel 10',
      studioId: 'TIL-008',
      status: 'online',
      streamHealth: 90,
      bitrate: '7.9 Mbps',
      resolution: '1920x1080',
      lastHeartbeat: '4 seconds ago',
      currentProgram: 'Evening Recap',
      nextProgram: 'Prime Stories',
      nextProgramTime: '18:00'
    }
  ];

  // Append locally created channels (offline) from localStorage
  const additionalChannels: LiveSource[] = (() => {
    try {
      const raw = localStorage.getItem('fastChannels');
      if (!raw) return [];
      const arr = JSON.parse(raw) as Array<{ id: string; name: string; status?: string; resolution?: string; posterDataUrl?: string; language?: string } >;
      return arr.map((c) => ({
        id: c.id,
        name: c.name,
        studioId: c.id.toUpperCase(),
        status: (c.status as any) || 'offline',
        streamHealth: 0,
        bitrate: '0 Mbps',
        resolution: c.resolution === '4k' ? '3840x2160' : c.resolution === '720p' ? '1280x720' : '1920x1080',
        lastHeartbeat: '—',
        posterUrl: c.posterDataUrl,
        language: c.language
      }));
    } catch {
      return [];
    }
  })();

  // Pagination logic
  const allChannels = [...mockSources, ...additionalChannels];
  const totalPages = Math.ceil(allChannels.length / channelsPerPage);
  const startIndex = (currentPage - 1) * channelsPerPage;
  const endIndex = startIndex + channelsPerPage;
  const currentChannels = allChannels.slice(startIndex, endIndex);

  const mockEvents: LiveEvent[] = [
    {
      id: '1',
      title: 'Morning News Live',
      sourceId: 'studio-1',
      startTime: '08:00',
      endTime: '09:30',
      status: 'live',
      viewerCount: 1250,
      priority: 'high',
      tags: ['news', 'live', 'morning']
    },
    {
      id: '2',
      title: 'Breaking News Special',
      sourceId: 'studio-2',
      startTime: '09:30',
      endTime: '10:00',
      status: 'live',
      viewerCount: 890,
      priority: 'critical',
      tags: ['breaking', 'news', 'special']
    },
    {
      id: '3',
      title: 'Sports Center Live',
      sourceId: 'studio-3',
      startTime: '11:00',
      endTime: '12:00',
      status: 'upcoming',
      priority: 'normal',
      tags: ['sports', 'live']
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-status-online" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-status-warning" />;
      case 'offline': return <XCircle className="h-4 w-4 text-status-offline" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-status-online text-white';
      case 'warning': return 'bg-status-warning text-black';
      case 'offline': return 'bg-status-offline text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-status-offline text-white';
      case 'high': return 'bg-status-warning text-black';
      case 'normal': return 'bg-broadcast-blue text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };


  const existingNames = [
    ...mockSources.map(s => s.name.toLowerCase()),
    ...additionalChannels.map(s => s.name.toLowerCase())
  ];

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPosterDataUrl(dataUrl);
      // Validate aspect ratio ~16:9
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const target = 16 / 9;
        if (Math.abs(ratio - target) > 0.1) {
          setPosterWarning('Poster is not ~16:9. It may be auto-cropped.');
        } else {
          setPosterWarning(null);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateChannel = () => {
    const trimmed = channelName.trim();
    if (!trimmed) {
      toast({ title: 'Channel Name is required', variant: 'destructive' });
      return;
    }
    if (existingNames.includes(trimmed.toLowerCase())) {
      toast({ title: 'Duplicate name', description: 'Another channel with this name already exists.', variant: 'destructive' });
      return;
    }
    if (!posterDataUrl) {
      toast({ title: 'Poster is required', variant: 'destructive' });
      return;
    }
    if (channelDescription.length > 200) {
      toast({ title: 'Description too long', description: 'Maximum 200 characters.', variant: 'destructive' });
      return;
    }

    const draft = {
      id: `draft-${Date.now()}`,
      name: trimmed,
      description: channelDescription,
      posterDataUrl,
      resolution,
      aspectRatio,
      primaryGenre: primaryGenre || null,
      language: language || null,
      epgMaster,
      tags,
      createdAt: Date.now(),
    };
    try {
      localStorage.setItem('fastChannelDraft', JSON.stringify(draft));
      localStorage.removeItem('fastChannelDraftHasPrograms');
    } catch {}
    setIsCreateOpen(false);
    setChannelName('');
    setChannelDescription('');
    setPosterDataUrl(null);
    setPrimaryGenre(undefined);
    setLanguage('English');
    setAspectRatio('Landscape (16:9)');
    setEpgMaster('1 Day');
    setTags([]);
    setTagInput('');
    setSelectedCampaign('');
    onNavigate?.('preview');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="page-heading text-slate-800 font-semibold">Fast Channels</h1>
            <p className="text-muted-foreground">Real-time Fast Channel Monitoring control</p>
          </div>
          <div>
            <Button variant="broadcast" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Fast Channel
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Live Sources Panel */}
        <div className="col-span-12">
          <Card className="bg-card-dark border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-broadcast-blue" />
                  Channel Status
                </span>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {currentChannels.filter(s => s.status === 'online').length} of {allChannels.length} online
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </div>
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-control-surface border border-border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 px-2 ${viewMode === 'list' ? 'bg-broadcast-blue text-white' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-broadcast-blue text-white' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                // List View (existing layout)
                <div className="space-y-4">
                  {currentChannels.map((source) => (
                    <div
                      key={source.id}
                      className={`p-4 rounded-lg border-2 shadow-sm ${
                        selectedSource === source.id
                          ? 'border-broadcast-blue bg-broadcast-blue/10'
                          : 'border-border bg-control-surface'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Poster - clickable to open Details modal */}
                        <div
                          className="flex-shrink-0 w-[20%] aspect-video rounded-md overflow-hidden border border-border bg-black/20 group cursor-pointer hover:shadow-md transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewSource(source);
                            setPreviewDialogOpen(true);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setPreviewSource(source);
                              setPreviewDialogOpen(true);
                            }
                          }}
                        >
                          <img
                            src={source.posterUrl || '/toi_global_poster.png'}
                            alt={source.name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>

                        {/* Middle - Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {getStatusIcon(source.status)}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-foreground truncate">{source.name}</h3>
                                  <span className="text-xs text-muted-foreground font-mono">({source.studioId})</span>
                                  <span className="text-xs text-muted-foreground">|</span>
                                  <span className="text-xs font-mono text-foreground">[ {(source.language || 'English').toUpperCase()} ]</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(source.status)}>{source.status}</Badge>
                              {source.status === 'online' && (
                                <div className="w-2 h-2 bg-pcr-live rounded-full animate-pulse-live"></div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-muted-foreground">Stream Health</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={source.streamHealth} className="flex-1 h-2" />
                                <span className="text-foreground font-mono">{source.streamHealth}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Bitrate</p>
                              <p className="text-foreground font-mono">{source.bitrate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Resolution</p>
                              <p className="text-foreground font-mono">{source.resolution}</p>
                            </div>
                          </div>

                          {(source.currentProgram || source.nextProgram) && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-start justify-between">
                                <div>
                                  {source.currentProgram && (
                                    <p className="text-sm text-foreground"><span className="font-semibold">Current:</span> {source.currentProgram}</p>
                                  )}
                                </div>
                                {source.nextProgram && (
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Next @{source.nextProgramTime}</p>
                                    <p className="text-sm text-foreground">{source.nextProgram}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground">Last heartbeat: {source.lastHeartbeat}</p>
                            {/* Action buttons */}
                            <div className="space-y-2">
                              {/* Details and Channel EPG - Same row */}
                              <div className="flex gap-1">
                                <Button
                                  variant="control"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewSource(source);
                                    setPreviewDialogOpen(true);
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                <Button
                                  variant="control"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                      localStorage.setItem('activeChannelName', source.name);
                                      localStorage.setItem('activeChannelStudioId', source.studioId);
                                    } catch {}
                                    window.location.href = '/channel-epg';
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Channel EPG
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid View (new card-based layout)
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentChannels.map((source) => (
                    <Card
                      key={source.id}
                      className={`relative overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
                        selectedSource === source.id
                          ? 'ring-2 ring-broadcast-blue bg-broadcast-blue/5'
                          : 'bg-control-surface border-border'
                      }`}
                    >
                      {/* Poster with overlay - clickable to open Details modal */}
                      <div
                        className="relative aspect-video w-full overflow-hidden group cursor-pointer hover:shadow-md transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewSource(source);
                          setPreviewDialogOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreviewSource(source);
                            setPreviewDialogOpen(true);
                          }
                        }}
                      >
                        <img
                          src={source.posterUrl || '/toi_global_poster.png'}
                          alt={source.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Status overlay */}
                        <div className="absolute top-2 left-2">
                          <Badge className={getStatusColor(source.status)}>
                            {source.status}
                          </Badge>
                        </div>
                        {/* Resolution badge */}
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-xs">
                            {source.resolution === '3840x2160' ? '4K' : source.resolution === '1920x1080' ? '1080p' : '720p'}
                          </Badge>
                        </div>
                        {/* Now Playing overlay */}
                        {source.currentProgram && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                            <div className="text-white">
                              <p className="text-xs text-white/70 mb-1">Now Playing</p>
                              <p className="text-sm font-semibold truncate">{source.currentProgram}</p>
                            </div>
                          </div>
                        )}
                        {/* Language badge - positioned at bottom right */}
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-xs">
                            {(source.language || 'English').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Health Progress Bar - below poster */}
                      <div className="px-4 pt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              source.streamHealth > 75 
                                ? 'bg-green-500' 
                                : source.streamHealth >= 40 
                                ? 'bg-orange-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${source.streamHealth}%` }}
                          />
                        </div>
                      </div>

                      {/* Card content */}
                      <CardContent className="p-4">
                        {/* Channel name (left) and studio ID (right) */}
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm truncate mb-0 min-w-0">{source.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono flex-shrink-0">{source.studioId}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2">
                          {/* Details and Channel EPG - Same row */}
                          <div className="flex gap-1">
                            <Button
                              variant="control"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSource(source);
                                setPreviewDialogOpen(true);
                              }}
                              className="flex-1 text-xs"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="control"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  localStorage.setItem('activeChannelName', source.name);
                                  localStorage.setItem('activeChannelStudioId', source.studioId);
                                } catch {}
                                window.location.href = '/channel-epg';
                              }}
                              className="flex-1 text-xs"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Channel EPG
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card-dark border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Radio className="h-5 w-5 text-broadcast-blue" />
                {previewSource?.name} - Live Preview
              </DialogTitle>
            </DialogHeader>
            {previewSource && (
              <div className="space-y-6">
                {/* Live Preview and Details Side by Side */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Live Preview */}
                  <div className="space-y-4">
                    {/* Feed Selection */}
                    <Tabs value={feedType} onValueChange={(value) => setFeedType(value as 'input' | 'output')}>
                      <TabsList className="grid w-full grid-cols-2 bg-slate-700 p-1">
                        <TabsTrigger 
                          value="input"
                          className="text-slate-300 data-[state=active]:bg-broadcast-blue data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                        >
                          Input Feed
                        </TabsTrigger>
                        <TabsTrigger 
                          value="output"
                          className="text-slate-300 data-[state=active]:bg-broadcast-blue data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                        >
                          Output Feed
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative">
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                          {feedType === 'input' ? 'INPUT' : 'OUTPUT'}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant={previewSource.status === 'online' ? 'default' : 'secondary'} 
                               className={previewSource.status === 'online' ? 'bg-red-600 text-white animate-pulse' : ''}>
                          {previewSource.status === 'online' ? 'LIVE' : previewSource.status.toUpperCase()}
                        </Badge>
                      </div>
                      {previewSource.status === 'online' ? (
                        <div className="text-white text-center">
                          <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Live Stream Preview</p>
                          <p className="text-sm opacity-75">{previewSource.name}</p>
                          <p className="text-xs opacity-50 mt-2">Resolution: {previewSource.resolution}</p>
                        </div>
                      ) : (
                        <div className="text-white text-center">
                          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-status-offline" />
                          <p className="text-lg">Stream Offline</p>
                          <p className="text-sm opacity-75">No signal available</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Destination Health Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-white">Destinations</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-black">JioTV: 1080P</span>
                          <Badge className="bg-green-600 text-white">Healthy</Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-black">YouTube: 1080p</span>
                          <Badge className="bg-green-600 text-white">Healthy</Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-black">Amagi: 1080P</span>
                          <Badge className="bg-red-600 text-white">Unhealthy</Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-black">YuppTV: 1080P</span>
                          <Badge className="bg-gray-600 text-white">No Data</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                       <Button variant="outline" className="border-white text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue">
                         <Settings className="h-4 w-4 mr-2" />
                         Manage Event
                       </Button>
                      <Button 
                        variant={previewSource.status === 'offline' ? 'default' : 'destructive'}
                        className={previewSource.status === 'offline' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {previewSource.status === 'offline' ? (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Start Now
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reboot Channel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Channel Details */}
                  <div className="space-y-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Stream Information</CardTitle>
                      </CardHeader>
                       <CardContent className="space-y-3">
                         <div className="flex justify-between">
                           <span className="text-slate-300">Studio ID:</span>
                           <span className="font-mono text-white">{previewSource.studioId}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Status:</span>
                           <Badge className={getStatusColor(previewSource.status)}>
                             {previewSource.status}
                           </Badge>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Stream Health:</span>
                           <span className="font-semibold text-white">{previewSource.streamHealth}%</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Resolution:</span>
                           <span className="text-white">{previewSource.resolution}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Bitrate:</span>
                           <span className="text-white">{previewSource.bitrate}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Last Heartbeat:</span>
                           <span className="text-white">{previewSource.lastHeartbeat}</span>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Program Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {previewSource.currentProgram ? (
                          <>
                             <div className="flex justify-between">
                               <span className="text-slate-300">Current Program:</span>
                               <span className="text-white font-medium">{previewSource.currentProgram}</span>
                             </div>
                             {previewSource.nextProgram && (
                               <>
                                 <div className="flex justify-between">
                                   <span className="text-slate-300">Next Program:</span>
                                   <span className="text-white">{previewSource.nextProgram}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-slate-300">Next Start Time:</span>
                                   <span className="text-white">{previewSource.nextProgramTime}</span>
                                 </div>
                               </>
                             )}
                           </>
                         ) : (
                           <div className="text-center text-slate-400">
                             <p>No program information available</p>
                           </div>
                         )}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Audio Levels:</span>
                            <div className="flex items-center gap-2">
                              {previewSource.status === 'online' ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full animate-pulse" style={{width: '70%'}}></div>
                                  </div>
                                  <span className="text-xs text-white">-12dB</span>
                                </div>
                              ) : (
                                <span className="text-white">Muted</span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">Next Program Type:</span>
                            <span className="text-white">VOD & Live Event</span>
                          </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Uptime:</span>
                           <span className="text-white">{previewSource.status === 'online' ? '24h 15m' : 'N/A'}</span>
                         </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Create Fast Channel Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="bg-card-dark border-border w-[85vw] max-w-6xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Fast Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Row 1: Title, Tags */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label className="text-foreground">Channel Name *</Label>
                  <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="Enter channel name" className="bg-control-surface border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground">Tags</Label>
                  <div className="mt-2 flex flex-wrap items-center gap-2 p-2 bg-control-surface border border-border rounded min-h-[40px]">
                    {tags.map((t, idx) => (
                      <span key={`${t}-${idx}`} className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-foreground text-xs border border-border">
                        {t}
                        <button
                          aria-label={`Remove ${t}`}
                          className="hidden group-hover:inline-flex text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            setTags(prev => prev.filter((tag, i) => i !== idx));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Spacebar') {
                          const newTag = tagInput.trim();
                          if (newTag) {
                            e.preventDefault();
                            setTags(prev => Array.from(new Set([...prev, newTag])));
                            setTagInput('');
                          }
                        }
                      }}
                      placeholder="Type tag and press space"
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <Label className="text-foreground">Description</Label>
                <Input value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} placeholder="Short description (max 200 chars)" className="bg-control-surface border-border text-foreground" />
                <div className="text-xs text-muted-foreground mt-1">{channelDescription.length}/200</div>
              </div>

              {/* Row 3: Select Playlist, Campaign, Category */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground">Select Playlist</Label>
                  <Select value={selectedPlaylist} onValueChange={(v) => setSelectedPlaylist(v)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
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
                <div>
                  <Label className="text-foreground">Campaign (optional)</Label>
                  <Select value={selectedCampaign} onValueChange={(v) => setSelectedCampaign(v)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignOptions.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name} ({campaign.duration})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Category</Label>
                  <Select value={primaryGenre} onValueChange={(v) => setPrimaryGenre(v)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {['News','Movies','Sports','Music','Comedy','Documentary','Talk Show','Kids','Lifestyle','Finance'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Resolution, Aspect Ratio, Language */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground">Resolution</Label>
                  <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="1080p">1080p (Default)</SelectItem>
                      <SelectItem value="4k">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as any)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Landscape (16:9)">Landscape (16:9)</SelectItem>
                      <SelectItem value="Vertical (9:16)">Vertical (9:16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Language (optional)</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'English',
                        'Hindi',
                        'Tamil',
                        'Malayalam',
                        'Bengali',
                        'Telugu',
                        'Kannada',
                        'Marathi',
                        'Gujarati',
                        'Punjabi',
                        'Oriya',
                        'Urdu',
                      ].map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5: Poster Upload, Poster Preview, and EPG Master */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground">Poster *</Label>
                  <Input type="file" accept="image/*" onChange={handlePosterChange} className="bg-control-surface border-border text-foreground" />
                  <div className="text-xs text-muted-foreground mt-1">No file chosen</div>
                  {posterWarning && <div className="text-xs text-orange-500 mt-1">{posterWarning}</div>}
                </div>
                <div>
                  <Label className="text-foreground">Poster Preview</Label>
                  <div className="mt-2 w-32 aspect-video rounded overflow-hidden border border-border bg-control-surface flex items-center justify-center">
                    {posterDataUrl ? (
                      <img src={posterDataUrl} alt="Poster preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground text-xs">No poster selected</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-foreground">EPG Master</Label>
                  <Select value={epgMaster} onValueChange={(v) => setEpgMaster(v)}>
                    <SelectTrigger className="bg-control-surface border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Day">1 Day</SelectItem>
                      <SelectItem value="7 Days">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button variant="broadcast" onClick={handleCreateChannel}>Create Channel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};