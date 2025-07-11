import { useState } from 'react';
import { Radio, XCircle, AlertTriangle, AlertCircle, CheckCircle, Clock, Settings, Tv, Wifi, WifiOff, Eye, Play, RotateCcw, Power, Calendar, PlayCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<LiveSource | null>(null);
  const [feedType, setFeedType] = useState<'input' | 'output'>('output');

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
    }
  ];

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


  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-broadcast-blue to-broadcast-blue-light bg-clip-text text-transparent">
              Fast Channels
            </h1>
            <p className="text-muted-foreground">Real-time monitoring and control of live streaming channels</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card-dark border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live Channels</p>
                <p className="text-2xl font-bold text-pcr-live">2</p>
              </div>
              <Radio className="h-8 w-8 text-pcr-live animate-pulse-live" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-dark border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-500">8</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-dark border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-orange-500">12</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-dark border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Off Line</p>
                <p className="text-2xl font-bold text-broadcast-blue">5</p>
              </div>
              <WifiOff className="h-8 w-8 text-broadcast-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Live Sources Panel */}
        <div className="col-span-8">
          <Card className="bg-card-dark border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-broadcast-blue" />
                  Channel Status
                </span>
                <div className="text-sm text-muted-foreground">
                  {mockSources.filter(s => s.status === 'online').length} of {mockSources.length} online
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSources.map((source) => (
                  <div 
                    key={source.id} 
                    className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedSource === source.id 
                        ? 'border-broadcast-blue bg-broadcast-blue/10' 
                        : 'border-border bg-control-surface hover:border-broadcast-blue/50'
                    }`}
                    onClick={(e) => {
                      // Only navigate if clicking outside the details button area
                      if (!(e.target as HTMLElement).closest('[data-details-button]')) {
                        setSelectedSource(source.id);
                        onNavigate?.('scheduler');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(source.status)}
                        <div>
                          <h3 className="font-semibold text-foreground">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">{source.studioId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(source.status)}>
                          {source.status}
                        </Badge>
                        {source.status === 'online' && (
                          <div className="w-2 h-2 bg-pcr-live rounded-full animate-pulse-live"></div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
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

                    {source.currentProgram && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Program</p>
                            <p className="font-medium text-foreground">{source.currentProgram}</p>
                          </div>
                          {source.nextProgram && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Next: {source.nextProgramTime}</p>
                              <p className="text-sm text-foreground">{source.nextProgram}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Last heartbeat: {source.lastHeartbeat}
                      </p>
                      <div className="flex items-center gap-2">
                        {source.status === 'online' ? (
                          <Wifi className="h-4 w-4 text-status-online" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-status-offline" />
                        )}
                        <div data-details-button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="px-4 py-2 bg-slate-600 text-white border-slate-600 hover:bg-slate-700 hover:border-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSource(source);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="input">Input Feed</TabsTrigger>
                        <TabsTrigger value="output">Output Feed</TabsTrigger>
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
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                       <Button variant="outline" className="border-white text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue">
                         <Settings className="h-4 w-4 mr-2" />
                         Source Settings
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
                         <div className="flex justify-between">
                           <span className="text-slate-300">Signal Strength:</span>
                           <span className="text-white">{previewSource.status === 'online' ? 'Strong' : 'No Signal'}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-slate-300">Audio Levels:</span>
                           <span className="text-white">{previewSource.status === 'online' ? '-12dB' : 'Muted'}</span>
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

        {/* Current Events Panel */}
        <div className="col-span-4 space-y-6">
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-pcr-live animate-pulse-live" />
                Live Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvents.map((event) => (
                  <div key={event.id} className="p-3 rounded-lg bg-control-surface border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-foreground text-sm">{event.title}</h3>
                      <Badge className={getPriorityColor(event.priority)}>
                        {event.priority}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <Tv className="h-3 w-3" />
                        {mockSources.find(s => s.id === event.sourceId)?.name}
                      </div>
                      {event.viewerCount && (
                        <div className="flex items-center gap-2">
                          <span>👥</span>
                          {event.viewerCount.toLocaleString()} viewers
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {event.status === 'live' && (
                        <>
                          <Button variant="control" size="sm" className="flex-1">
                            Monitor
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1">
                            End Early
                          </Button>
                        </>
                      )}
                      {event.status === 'upcoming' && (
                        <Button variant="scheduled" size="sm" className="w-full">
                          Start Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-status-warning" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Alert className="border-status-warning bg-status-warning/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-foreground text-sm">
                    Studio 3 stream quality degraded to 75%
                  </AlertDescription>
                </Alert>
                <Alert className="border-status-offline bg-status-offline/10">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-foreground text-sm">
                    Remote camera connection lost
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};