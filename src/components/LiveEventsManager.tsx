import { useState } from 'react';
import { Radio, AlertTriangle, CheckCircle, XCircle, Clock, Settings, Tv, Wifi, WifiOff, Eye, Play, RotateCcw, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export const LiveEventsManager = () => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<LiveSource | null>(null);

  const mockSources: LiveSource[] = [
    {
      id: 'studio-1',
      name: 'Fast Channel 1',
      studioId: 'STU-001',
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
      studioId: 'STU-002',
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
      studioId: 'STU-003',
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

  const EmergencyOverrideDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="offline" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Emergency Override
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card-dark border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-offline" />
            Emergency EPG Override
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert className="border-status-offline bg-status-offline/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              This will interrupt current programming and override the EPG schedule.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="override-title">Emergency Program Title</Label>
            <Input 
              id="override-title" 
              placeholder="Breaking News: Emergency Broadcast"
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="override-source">Live Source</Label>
            <select className="w-full p-2 rounded bg-control-surface border border-border text-foreground">
              {mockSources
                .filter(source => source.status === 'online')
                .map(source => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.studioId})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label htmlFor="override-message">Emergency Message</Label>
            <Textarea 
              id="override-message" 
              placeholder="Describe the emergency or special broadcast..."
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="offline" className="flex-1">
              Activate Emergency Override
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
          <h1 className="text-2xl font-bold text-foreground">Live Channel Status</h1>
          <p className="text-muted-foreground">Monitor live sources and manage real-time programming</p>
        </div>
        <div className="flex items-center gap-4">
          <EmergencyOverrideDialog />
          <Button variant="broadcast">
            <Settings className="h-4 w-4 mr-2" />
            Source Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Live Sources Panel */}
        <div className="col-span-8">
          <Card className="bg-card-dark border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-broadcast-blue" />
                  Live Sources Status
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
                    onClick={() => setSelectedSource(source.id)}
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
                        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setPreviewSource(source)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card-dark border-border">
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
                                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
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

                                  {/* Channel Details */}
                                  <div className="space-y-4">
                                    <Card className="bg-control-surface border-border">
                                      <CardHeader>
                                        <CardTitle className="text-lg text-foreground">Stream Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Studio ID:</span>
                                          <span className="font-mono text-foreground">{previewSource.studioId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Status:</span>
                                          <Badge className={getStatusColor(previewSource.status)}>
                                            {previewSource.status}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Stream Health:</span>
                                          <span className="font-semibold text-foreground">{previewSource.streamHealth}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Resolution:</span>
                                          <span className="text-foreground">{previewSource.resolution}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Bitrate:</span>
                                          <span className="text-foreground">{previewSource.bitrate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Last Heartbeat:</span>
                                          <span className="text-foreground">{previewSource.lastHeartbeat}</span>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-control-surface border-border">
                                      <CardHeader>
                                        <CardTitle className="text-lg text-foreground">Program Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        {previewSource.currentProgram ? (
                                          <>
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Current Program:</span>
                                              <span className="text-foreground font-medium">{previewSource.currentProgram}</span>
                                            </div>
                                            {previewSource.nextProgram && (
                                              <>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Next Program:</span>
                                                  <span className="text-foreground">{previewSource.nextProgram}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Next Start Time:</span>
                                                  <span className="text-foreground">{previewSource.nextProgramTime}</span>
                                                </div>
                                              </>
                                            )}
                                          </>
                                        ) : (
                                          <div className="text-center text-muted-foreground">
                                            <p>No program information available</p>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Signal Strength:</span>
                                          <span className="text-foreground">{previewSource.status === 'online' ? 'Strong' : 'No Signal'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Audio Levels:</span>
                                          <span className="text-foreground">{previewSource.status === 'online' ? '-12dB' : 'Muted'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Uptime:</span>
                                          <span className="text-foreground">{previewSource.status === 'online' ? '24h 15m' : 'N/A'}</span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>

                                {/* Action Button */}
                                <div className="flex justify-center pt-4 border-t border-border">
                                  <Button
                                    variant={previewSource.status === 'offline' ? 'default' : 'control'}
                                    size="lg"
                                    className="flex items-center gap-2"
                                  >
                                    {previewSource.status === 'offline' ? (
                                      <>
                                        <Power className="h-4 w-4" />
                                        Start Now
                                      </>
                                    ) : (
                                      <>
                                        <RotateCcw className="h-4 w-4" />
                                        Reboot Channel
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

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