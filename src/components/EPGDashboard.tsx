import { useState, useRef } from 'react';
import { Clock, Radio, PlayCircle, Calendar, Globe, XCircle, AlertCircle, WifiOff, Plus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageAdsModal } from './ManageAdsModal';
import { RepeatScheduleModal } from './RepeatScheduleModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EPGItem } from '../types';

const AddBlockDialog = ({ type, onAdd }: { type: 'VOD' | 'Event', onAdd: (item: EPGItem) => void }) => {
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
        const newItem: EPGItem = {
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

export const EPGDashboard = () => {
  const [nowPlaying, setNowPlaying] = useState<EPGItem | null>({
    id: 'np',
    time: '12:00',
    title: 'Live Sports Commentary',
    type: 'PCR',
    duration: 60,
    status: 'live',
    geoZone: 'Global',
    genre: 'Sports',
    imageUrl: '/toi_global_poster.png'
  });

  const [mockEPGItems, setMockEPGItems] = useState<EPGItem[]>([
    {
      id: '1',
      time: '13:00',
      title: 'Post-Match Analysis',
      type: 'PCR',
      duration: 30,
      status: 'scheduled',
      geoZone: 'Global',
      genre: 'Sports',
      imageUrl: '/toi_global_poster.png'
    },
    {
      id: '2',
      time: '13:30',
      title: 'Tech Tomorrow',
      type: 'MCR',
      duration: 45,
      status: 'scheduled',
      geoZone: 'US/EU',
      genre: 'Tech',
      imageUrl: '/toi_global_poster.png'
    },
    {
      id: '3',
      time: '14:15',
      title: 'Network Outage',
      type: 'PCR',
      duration: 0,
      status: 'offline',
      geoZone: 'Global',
      genre: 'News',
      imageUrl: '/toi_global_poster.png'
    },
  ]);

  const [isManageAdsModalOpen, setIsManageAdsModalOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);

  const handleAdSave = (adConfig: any) => {
    console.log('Ad config saved:', adConfig);
    setIsManageAdsModalOpen(false);
  };

  const handleRepeatSave = (startDate: string, endDate: string, selectedDays: number[]) => {
    console.log('Repeat schedule saved:', { startDate, endDate, selectedDays });
    setIsRepeatModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-pcr-live text-white';
      case 'scheduled': return 'bg-status-scheduled text-black';
      case 'offline': return 'bg-status-offline text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (time: string, duration: number) => {
    const [startHour, startMinute] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(startDate.getTime() + duration * 60000);

    const format = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `${format(startDate)} - ${format(endDate)}`;
  }


  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8 space-y-6">
        <Card className="bg-card-dark border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Now Playing</CardTitle>
                <CardDescription>Live EPG feed status</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono text-broadcast-blue">{formatTime(nowPlaying?.time || '00:00', nowPlaying?.duration || 0)}</div>
                <div className="text-sm text-muted-foreground">Live Status</div>
              </div>
            </CardHeader>
            <CardContent>
              {nowPlaying ? (
                <div className="flex items-center gap-4">
                  <img src={nowPlaying.imageUrl} alt={nowPlaying.title} className="w-24 h-24 rounded-lg object-cover" />
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">{nowPlaying.title}</h2>
                    <p className="text-muted-foreground">{nowPlaying.description}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge className={nowPlaying.type === 'PCR' ? 'bg-pcr-live' : 'bg-mcr-playlist'}>{nowPlaying.type}</Badge>
                      <Badge className={getStatusColor(nowPlaying.status)}>{nowPlaying.status}</Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">{nowPlaying.geoZone}</Badge>
                      <Badge variant="secondary">{nowPlaying.genre}</Badge>
                    </div>
            </div>
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <WifiOff className="h-12 w-12" />
                  <p className="mt-4">No program is currently live.</p>
            </div>
              )}
          </CardContent>
        </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today's Schedule</span>
                <div className="flex gap-2">
                            <AddBlockDialog type="VOD" onAdd={(newItem) => setMockEPGItems(prev => [...prev, newItem])} />
                            <AddBlockDialog type="Event" onAdd={(newItem) => setMockEPGItems(prev => [...prev, newItem])} />
                            <Button variant="control" size="sm" onClick={() => setIsRepeatModalOpen(true)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy EPG
                            </Button>
                            <Button variant="control" size="sm" onClick={() => setIsManageAdsModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Manage Ads
                  </Button>
                  <Button variant="broadcast" size="sm">
                    Add Program
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEPGItems.map((item) => (
                            <div key={item.id} className="flex items-center p-3 rounded-lg bg-control-surface border border-border">
                                <div className="w-24">
                                    <span className="font-mono text-sm text-muted-foreground">{formatTime(item.time, item.duration)}</span>
                        </div>
                                <div className="flex-grow flex items-center gap-4">
                                    <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-sm object-cover" />
                        <div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                                            <Badge className={item.type === 'PCR' ? 'bg-pcr-live' : 'bg-mcr-playlist'}>{item.type}</Badge>
                                            <span className="text-xs text-muted-foreground">{item.geoZone}</span>
                                            {item.genre && <Badge variant="secondary">{item.genre}</Badge>}
                          </div>
                        </div>
                      </div>
                                <div className="w-32 text-right">
                                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Master Control Room (MCR)</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Production Control Room (PCR)</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Playout Automation</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Warning</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CDN Uplink</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Offline</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 text-blue-400 p-2 rounded-full">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-foreground">"Morning News" started on PCR-1.</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 text-purple-400 p-2 rounded-full">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-foreground">EPG for "Main Channel" was updated.</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-red-500/20 text-red-400 p-2 rounded-full">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-foreground">MCR-2 reported a playback error.</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
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
    </div>
  );
};