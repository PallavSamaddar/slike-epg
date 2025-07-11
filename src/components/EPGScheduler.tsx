import { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, Tag, Copy, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ScheduleBlock {
  id: string;
  time: string;
  duration: number;
  title: string;
  type: 'PCR' | 'MCR';
  status: 'scheduled' | 'live' | 'completed';
  geoZone: string;
  tags: string[];
  description?: string;
}

export const EPGScheduler = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdConfigOpen, setIsAdConfigOpen] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([
    {
      id: '0',
      time: '00:00',
      duration: 60,
      title: 'Midnight Movies',
      type: 'MCR',
      status: 'completed',
      geoZone: 'Global',
      tags: ['Movies', 'Late Night'],
      description: 'Late night movie programming'
    },
    {
      id: '1',
      time: '01:00',
      duration: 60,
      title: 'Night Talk Show',
      type: 'PCR',
      status: 'completed',
      geoZone: 'US/EU',
      tags: ['Talk', 'Late Night'],
      description: 'Late night talk show'
    },
    {
      id: '2',
      time: '02:00',
      duration: 60,
      title: 'Morning News Live',
      type: 'PCR',
      status: 'live',
      geoZone: 'Global',
      tags: ['Live', 'News'],
      description: 'Live morning news broadcast'
    },
    {
      id: '3',
      time: '03:00',
      duration: 60,
      title: 'Talk Show Today',
      type: 'PCR',
      status: 'scheduled',
      geoZone: 'Global',
      tags: ['Talk', 'Entertainment'],
      description: 'Morning talk show'
    },
    {
      id: '4',
      time: '04:00',
      duration: 60,
      title: 'Coffee Break Show',
      type: 'MCR',
      status: 'scheduled',
      geoZone: 'US/EU',
      tags: ['Lifestyle', 'Entertainment'],
      description: 'Light entertainment programming'
    },
    {
      id: '5',
      time: '05:00',
      duration: 60,
      title: 'Game Time',
      type: 'MCR',
      status: 'scheduled',
      geoZone: 'Global',
      tags: ['Games', 'Fun'],
      description: 'Interactive game show'
    },
    {
      id: '6',
      time: '06:00',
      duration: 60,
      title: 'Morning Movies',
      type: 'MCR',
      status: 'scheduled',
      geoZone: 'US/EU',
      tags: ['Movies', 'Classic'],
      description: 'Classic movie collection'
    },
    {
      id: '7',
      time: '07:00',
      duration: 60,
      title: 'Breakfast Special',
      type: 'PCR',
      status: 'scheduled',
      geoZone: 'Global',
      tags: ['Special', 'Morning'],
      description: 'Special morning programming'
    }
  ]);

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const getBlockColor = (type: string, status: string) => {
    if (status === 'live') return 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50 text-white';
    if (status === 'completed') return 'bg-gray-300 border-gray-200 text-gray-800';
    if (status === 'scheduled') return 'bg-orange-300 border-orange-200 text-orange-900';
    return 'bg-gray-300 border-gray-200 text-gray-800';
  };

  const AddBlockDialog = ({ type }: { type: 'PCR' | 'MCR' }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant={type === 'PCR' ? 'live' : 'playlist'} 
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
            Add {type === 'PCR' ? 'Live Studio' : 'Playlist'} Block
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

          {type === 'PCR' && (
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

          {type === 'MCR' && (
            <div>
              <Label htmlFor="playlist">Playlist</Label>
              <Select>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue placeholder="Select playlist" />
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
              <Button variant="outline" size="sm" className="w-full justify-start bg-slate-600 text-white border-slate-600 hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Slike Video
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-slate-600 text-white border-slate-600 hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Live Recording
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-slate-600 text-white border-slate-600 hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Live Feed
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-slate-600 text-white border-slate-600 hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Live Event
              </Button>
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
                            {/* Ad Break every 30 minutes */}
                            {time.endsWith('30') && (
                              <div className="bg-yellow-200 border border-yellow-100 text-yellow-800 rounded p-2 mb-2 text-xs font-medium">
                                Ad Break - 30s
                              </div>
                            )}
                            {/* Scheduled blocks */}
                            {scheduleBlocks
                              .filter(block => block.time === time)
                              .map(block => (
                                <div
                                  key={block.id}
                                  className={`
                                    p-3 rounded border-2 cursor-pointer transition-all
                                    ${getBlockColor(block.type, block.status)}
                                  `}
                                  style={{ 
                                    height: `${Math.max(60, block.duration / 30 * 30)}px` 
                                  }}
                                >
                                   <div className="flex items-center justify-between mb-1">
                                     <span className="font-medium text-sm text-white">
                                       {block.title}
                                     </span>
                                    <div className="flex items-center gap-1">
                                      <Badge 
                                        className={`text-xs ${
                                          block.type === 'PCR' 
                                            ? 'bg-pcr-live text-white' 
                                            : 'bg-mcr-playlist text-white'
                                        }`}
                                      >
                                        {block.type}
                                      </Badge>
                                      {block.status === 'live' && (
                                        <div className="w-2 h-2 bg-pcr-live-glow rounded-full animate-pulse-live"></div>
                                      )}
                                    </div>
                                  </div>
                                   <div className="text-xs text-white/80">
                                     {block.duration}min • {block.geoZone}
                                   </div>
                                  {block.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                       {block.tags.slice(0, 2).map((tag, idx) => (
                                         <span key={idx} className="text-xs px-1 py-0.5 bg-black/30 text-white rounded">
                                           {tag}
                                         </span>
                                       ))}
                                    </div>
                                  )}
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
        </div>
      </div>
    </div>
  );
};