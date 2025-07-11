import { useState } from 'react';
import { Clock, Radio, PlayCircle, Calendar, Globe, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EPGItem {
  id: string;
  title: string;
  type: 'PCR' | 'MCR';
  startTime: string;
  endTime: string;
  status: 'live' | 'scheduled' | 'offline';
  geoZone?: string;
  tags?: string[];
}

export const EPGDashboard = () => {
  const [currentTime] = useState(new Date().toLocaleTimeString());
  
  const mockEPGItems: EPGItem[] = [
    {
      id: '1',
      title: 'Morning News Live',
      type: 'PCR',
      startTime: '08:00',
      endTime: '09:00',
      status: 'live',
      geoZone: 'Global',
      tags: ['Breaking', 'News']
    },
    {
      id: '2',
      title: 'Classic Movies Playlist',
      type: 'MCR',
      startTime: '09:00',
      endTime: '12:00',
      status: 'scheduled',
      geoZone: 'US/EU',
      tags: ['Movies']
    },
    {
      id: '3',
      title: 'Tech Talk Special',
      type: 'PCR',
      startTime: '14:00',
      endTime: '15:00',
      status: 'scheduled',
      geoZone: 'Global',
      tags: ['Special', 'Tech']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-pcr-live text-white';
      case 'scheduled': return 'bg-status-scheduled text-black';
      case 'offline': return 'bg-status-offline text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'PCR' ? 'bg-pcr-live text-white' : 'bg-mcr-playlist text-white';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-broadcast-blue to-broadcast-blue-light bg-clip-text text-transparent">
              EPG Control Center
            </h1>
            <p className="text-muted-foreground">Electronic Program Guide Management System</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-broadcast-blue">{currentTime}</div>
            <div className="text-sm text-muted-foreground">Live Status</div>
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
              <Calendar className="h-8 w-8 text-red-500" />
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
              <PlayCircle className="h-8 w-8 text-orange-500" />
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
              <Globe className="h-8 w-8 text-broadcast-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-control-surface">
          <TabsTrigger value="today" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
            Week View
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
            Monthly View
          </TabsTrigger>
          <TabsTrigger value="geo" className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white">
            Geo Filter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today's Schedule</span>
                <div className="flex gap-2">
                  <Button variant="control" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Now Playing
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
                  <div key={item.id} className="p-4 rounded-lg bg-control-surface border border-border hover:border-broadcast-blue transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-mono text-muted-foreground">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTypeColor(item.type)}>
                              {item.type}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            {item.geoZone && (
                              <Badge variant="outline" className="border-border text-muted-foreground">
                                {item.geoZone}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'live' && (
                          <div className="flex items-center gap-1 text-pcr-live">
                            <div className="w-2 h-2 bg-pcr-live rounded-full animate-pulse-live"></div>
                            <span className="text-sm">LIVE</span>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <Card className="bg-card-dark border-border">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Weekly Schedule View</h3>
                <p>7-day EPG scheduling grid will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <Card className="bg-card-dark border-border">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-broadcast-blue" />
                <h3 className="text-lg font-semibold mb-2">Monthly Schedule View</h3>
                <p>30-day EPG scheduling calendar will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geo" className="mt-6">
          <Card className="bg-card-dark border-border">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 text-broadcast-blue" />
                <h3 className="text-lg font-semibold mb-2">Geographic Content Distribution</h3>
                <p>Regional content filtering and distribution management</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};