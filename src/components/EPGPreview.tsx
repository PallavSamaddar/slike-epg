import { useState } from 'react';
import { Download, FileText, Code, Database, Eye, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EPGPreviewItem {
  id: string;
  time: string;
  title: string;
  type: 'PCR' | 'MCR';
  duration: number;
  geoZone: string;
  description?: string;
  status: 'live' | 'scheduled' | 'completed';
}

export const EPGPreview = () => {
  const [selectedFormat, setSelectedFormat] = useState('xmltv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [geoFilter, setGeoFilter] = useState('all');
  const [previewMode, setPreviewMode] = useState<'viewer' | 'affiliate' | 'api'>('viewer');

  const mockEPGData: EPGPreviewItem[] = [
    {
      id: '1',
      time: '08:00',
      title: 'Morning News Live',
      type: 'PCR',
      duration: 90,
      geoZone: 'Global',
      description: 'Live morning news broadcast with breaking news updates',
      status: 'live'
    },
    {
      id: '2',
      time: '09:30',
      title: 'Weather Update',
      type: 'PCR',
      duration: 15,
      geoZone: 'Global',
      description: 'Local and national weather forecast',
      status: 'scheduled'
    },
    {
      id: '3',
      time: '09:45',
      title: 'Classic Movies Marathon',
      type: 'MCR',
      duration: 135,
      geoZone: 'US/EU',
      description: 'Curated selection of classic Hollywood films',
      status: 'scheduled'
    },
    {
      id: '4',
      time: '12:00',
      title: 'Sports Center Live',
      type: 'PCR',
      duration: 60,
      geoZone: 'Global',
      description: 'Live sports news and highlights',
      status: 'scheduled'
    }
  ];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return new Date(`2024-01-01T${hours}:${minutes}:00`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-pcr-live text-white';
      case 'scheduled': return 'bg-status-scheduled text-black';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'PCR' ? 'bg-pcr-live text-white' : 'bg-mcr-playlist text-white';
  };

  const generateXMLTV = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="main-channel">
    <display-name>Main Channel</display-name>
  </channel>
  ${mockEPGData.map(item => `
  <programme start="${new Date().toISOString().split('T')[0]}${item.time.replace(':', '')}00 +0000" 
             stop="${new Date().toISOString().split('T')[0]}${String(parseInt(item.time.split(':')[0]) + Math.floor(item.duration / 60)).padStart(2, '0')}${String((parseInt(item.time.split(':')[1]) + item.duration % 60) % 60).padStart(2, '0')}00 +0000"
             channel="main-channel">
    <title>${item.title}</title>
    <desc>${item.description || ''}</desc>
    <category>${item.type}</category>
    <live>${item.status === 'live' ? 'true' : 'false'}</live>
  </programme>`).join('')}
</tv>`;
  };

  const generateJSON = () => {
    return JSON.stringify({
      channel: "main-channel",
      updated: new Date().toISOString(),
      programmes: mockEPGData.map(item => ({
        id: item.id,
        title: item.title,
        start_time: item.time,
        duration_minutes: item.duration,
        type: item.type,
        geo_zone: item.geoZone,
        description: item.description,
        status: item.status,
        is_live: item.status === 'live'
      }))
    }, null, 2);
  };

  const generateAPI = () => {
    const now = new Date();
    const current = mockEPGData.find(item => item.status === 'live');
    const next = mockEPGData.find(item => item.status === 'scheduled');
    
    return JSON.stringify({
      timestamp: now.toISOString(),
      now: current ? {
        title: current.title,
        type: current.type,
        start_time: current.time,
        remaining_minutes: Math.floor(Math.random() * 45) + 15
      } : null,
      next: next ? {
        title: next.title,
        type: next.type,
        start_time: next.time,
        duration_minutes: next.duration
      } : null,
      later: mockEPGData.filter(item => item.status === 'scheduled').slice(1, 4)
    }, null, 2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">EPG Preview & Export</h1>
          <p className="text-muted-foreground">Preview your EPG and export in multiple formats</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="control">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="broadcast">
            <Settings className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Preview Panel */}
        <div className="col-span-8">
          <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)}>
            <TabsList className="grid w-full grid-cols-3 bg-control-surface">
              <TabsTrigger 
                value="viewer" 
                className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Viewer EPG
              </TabsTrigger>
              <TabsTrigger 
                value="affiliate" 
                className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Affiliate View
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
              >
                <Code className="h-4 w-4 mr-2" />
                API Response
              </TabsTrigger>
            </TabsList>

            <TabsContent value="viewer" className="mt-6">
              <Card className="bg-card-dark border-border">
                <CardHeader>
                  <CardTitle>End-User EPG View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-control-surface rounded-lg p-4">
                    <div className="text-center mb-4 pb-4 border-b border-border">
                      <h2 className="text-xl font-bold text-broadcast-blue">Main Channel</h2>
                      <p className="text-sm text-muted-foreground">Today's Programming</p>
                    </div>
                    
                    <div className="space-y-3">
                      {mockEPGData.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded bg-background border border-border">
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-mono text-broadcast-blue w-16">
                              {formatTime(item.time)}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            {item.status === 'live' && (
                              <div className="w-2 h-2 bg-pcr-live rounded-full animate-pulse-live"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="affiliate" className="mt-6">
              <Card className="bg-card-dark border-border">
                <CardHeader>
                  <CardTitle>Affiliate/Partner EPG Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockEPGData.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg bg-control-surface border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-muted-foreground">{item.time}</span>
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(item.type)}>
                              {item.type}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Duration:</span> {item.duration} min
                          </div>
                          <div>
                            <span className="font-medium">Geo Zone:</span> {item.geoZone}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {item.type === 'PCR' ? 'Live Studio' : 'Playlist'}
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="mt-6">
              <Card className="bg-card-dark border-border">
                <CardHeader>
                  <CardTitle>API Response Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/50 rounded-lg p-4 overflow-auto">
                    <pre className="text-sm text-green-400 font-mono">
                      {generateAPI()}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Export Controls */}
        <div className="col-span-4 space-y-6">
          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="format">Output Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="bg-control-surface border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xmltv">XMLTV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="api">API Endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="geo">Geographic Filter</Label>
                <Select value={geoFilter} onValueChange={setGeoFilter}>
                  <SelectTrigger className="bg-control-surface border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="global">Global Only</SelectItem>
                    <SelectItem value="us-eu">US/EU Only</SelectItem>
                    <SelectItem value="americas">Americas Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <Label htmlFor="metadata">Include Metadata</Label>
              </div>

              <div className="space-y-2">
                <Button variant="broadcast" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export EPG Data
                </Button>
                <Button variant="control" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Generate API URL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle>Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/50 rounded-lg p-3 max-h-96 overflow-auto">
                <pre className="text-xs text-green-400 font-mono">
                  {selectedFormat === 'xmltv' && generateXMLTV()}
                  {selectedFormat === 'json' && generateJSON()}
                  {selectedFormat === 'api' && generateAPI()}
                  {selectedFormat === 'csv' && 'Time,Title,Type,Duration,Geo Zone,Status\n08:00,Morning News Live,PCR,90,Global,live\n09:30,Weather Update,PCR,15,Global,scheduled\n...'}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-dark border-border">
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="control" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Send to CDN
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Update OTT Platform
              </Button>
              <Button variant="control" size="sm" className="w-full justify-start">
                <Code className="h-4 w-4 mr-2" />
                Webhook Notify
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};