import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Play, Search, Plus, X, GripVertical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Asset {
  id: string;
  title: string;
  duration: number;
  type: string;
  vendor: string;
  createdAt: string;
}

interface PlaylistItem {
  id: string;
  title: string;
  duration: number;
  type: string;
  vendor: string;
}

interface FilterGroup {
  id: string;
  type: 'include' | 'exclude';
  filters: Filter[];
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
}

interface Props {
  onNavigate?: (view: string) => void;
  playlistId?: string;
  isEdit?: boolean;
}

const SortableItem = ({ id, children }: { id: string, children: (listeners: Record<string, unknown>) => React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
};

export const PlaylistCreateEdit = ({ onNavigate, playlistId, isEdit = false }: Props) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'Basic' | 'Advanced'>('Basic');
  const [playlistName, setPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', type: 'include', filters: [] }
  ]);
  const [dedupeWindow, setDedupeWindow] = useState('None');
  const [fallbackStrategy, setFallbackStrategy] = useState('Loop');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(30);

  // Mock data
  const mockAssets: Asset[] = [
    { id: '1', title: 'Breaking News Update', duration: 3, type: 'Video', vendor: 'ANI', createdAt: '2024-01-20' },
    { id: '2', title: 'Sports Highlights', duration: 5, type: 'Video', vendor: 'TOI', createdAt: '2024-01-19' },
    { id: '3', title: 'Tech Review - iPhone 15', duration: 8, type: 'Video', vendor: 'NBT', createdAt: '2024-01-18' },
    { id: '4', title: 'Music Video - Bollywood', duration: 4, type: 'Video', vendor: 'AFP', createdAt: '2024-01-17' },
    { id: '5', title: 'Cooking Show', duration: 12, type: 'Video', vendor: 'TOI', createdAt: '2024-01-16' },
    { id: '6', title: 'Weather Update', duration: 2, type: 'Video', vendor: 'ANI', createdAt: '2024-01-15' },
    { id: '7', title: 'Entertainment News', duration: 6, type: 'Video', vendor: 'NBT', createdAt: '2024-01-14' },
    { id: '8', title: 'Documentary - Nature', duration: 15, type: 'Video', vendor: 'AFP', createdAt: '2024-01-13' },
  ];

  const vendors = ['ANI', 'AFP', 'TOI', 'NBT'];
  const categories = ['News', 'Sports', 'Entertainment', 'Finance', 'Lifestyle'];
  const products = ['TOI', 'Languages', 'ET Online', 'IndiaTimes'];
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];
  const publishedTo = ['Denmark', 'YouTube', 'Facebook'];
  const priorities = ['Latest', 'Trending', 'Top Viewed'];

  useEffect(() => {
    if (isEdit && playlistId) {
      loadPlaylistData();
    }
  }, [isEdit, playlistId]);

  const loadPlaylistData = async () => {
    // Mock loading playlist data
    setPlaylistName('Sample Playlist');
    setNotes('This is a sample playlist for testing');
  };

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      const filtered = mockAssets.filter(asset =>
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.vendor.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setIsLoading(false);
    }, 300);
  };

  const addToPlaylist = (asset: Asset) => {
    const playlistItem: PlaylistItem = {
      id: asset.id,
      title: asset.title,
      duration: asset.duration,
      type: asset.type,
      vendor: asset.vendor
    };
    setPlaylistItems(prev => [...prev, playlistItem]);
    toast({
      title: 'Added to playlist',
      description: `${asset.title} has been added to the playlist.`,
    });
  };

  const removeFromPlaylist = (itemId: string) => {
    setPlaylistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setPlaylistItems(prev => {
        const oldIndex = prev.findIndex(item => item.id === active.id);
        const newIndex = prev.findIndex(item => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      type: 'include',
      filters: []
    };
    setFilterGroups(prev => [...prev, newGroup]);
  };

  const removeFilterGroup = (groupId: string) => {
    setFilterGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const addFilter = (groupId: string) => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: 'keywords',
      operator: 'contains',
      value: ''
    };
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, filters: [...group.filters, newFilter] }
        : group
    ));
  };

  const removeFilter = (groupId: string, filterId: string) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, filters: group.filters.filter(f => f.id !== filterId) }
        : group
    ));
  };

  const updateFilter = (groupId: string, filterId: string, field: string, value: string | string[]) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            filters: group.filters.map(f => 
              f.id === filterId ? { ...f, [field]: value } : f
            )
          }
        : group
    ));
  };

  const calculatePreviewFill = () => {
    const totalDuration = playlistItems.reduce((sum, item) => sum + item.duration, 0);
    const fillPercentage = Math.min((totalDuration / previewDuration) * 100, 100);
    return { totalDuration, fillPercentage };
  };

  const { totalDuration, fillPercentage } = calculatePreviewFill();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <PageHeader 
        title={isEdit ? 'Edit Playlist' : 'Create Playlist'}
        subtitle={isEdit ? 'Modify your playlist settings and content' : 'Create a new playlist for your content'}
      />
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => onNavigate?.('playlists')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playlists
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="broadcast">
            <Play className="h-4 w-4 mr-2" />
            Activate
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="bg-card-dark border-border mb-6">
        <CardHeader>
          <CardTitle>Playlist Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="playlist-name">Playlist Name *</Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="bg-control-surface border-border text-foreground"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this playlist"
              className="bg-control-surface border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode Selector */}
      <Card className="bg-card-dark border-border mb-6">
        <CardHeader>
          <CardTitle>Playlist Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'Basic' | 'Advanced')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Basic">Basic (Manual)</TabsTrigger>
              <TabsTrigger value="Advanced">Advanced (Rule-based)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="Basic" className="mt-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Search Assets */}
                <div>
                  <h3 className="font-medium mb-4">Search Assets</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by keyword, vendor, type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-control-surface border-border text-foreground"
                      />
                      <Button onClick={handleSearch} disabled={isLoading}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map((asset) => (
                        <div key={asset.id} className="p-3 border border-border rounded bg-control-surface">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{asset.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {asset.duration}m • {asset.type} • {asset.vendor}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToPlaylist(asset)}
                              disabled={playlistItems.some(item => item.id === asset.id)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Playlist Order */}
                <div>
                  <h3 className="font-medium mb-4">Playlist Order</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={playlistItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        {playlistItems.map((item) => (
                          <SortableItem key={item.id} id={item.id}>
                            {(listeners) => (
                              <div className="p-3 border border-border rounded bg-control-surface flex items-center gap-2">
                                <div {...listeners} className="cursor-grab">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{item.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.duration}m • {item.vendor}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFromPlaylist(item.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="font-medium mb-4">Preview</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Preview Duration</Label>
                      <Select value={previewDuration.toString()} onValueChange={(value) => setPreviewDuration(Number(value))}>
                        <SelectTrigger className="bg-control-surface border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Fill: {totalDuration}m / {previewDuration}m</span>
                        <span>{Math.round(fillPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-broadcast-blue h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    {fillPercentage < 100 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Playlist will loop to fill the remaining {previewDuration - totalDuration} minutes.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="Advanced" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Filter Composer */}
                <div>
                  <h3 className="font-medium mb-4">Filter Composer</h3>
                  <div className="space-y-4">
                    {filterGroups.map((group) => (
                      <div key={group.id} className="p-4 border border-border rounded bg-control-surface">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Select 
                              value={group.type} 
                              onValueChange={(value) => setFilterGroups(prev => prev.map(g => 
                                g.id === group.id ? { ...g, type: value as 'include' | 'exclude' } : g
                              ))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="include">Include</SelectItem>
                                <SelectItem value="exclude">Exclude</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge variant={group.type === 'include' ? 'default' : 'secondary'}>
                              {group.type}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => addFilter(group.id)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Filter
                            </Button>
                            {filterGroups.length > 1 && (
                              <Button size="sm" variant="ghost" onClick={() => removeFilterGroup(group.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {group.filters.map((filter) => (
                            <div key={filter.id} className="flex gap-2 items-center">
                              <Select 
                                value={filter.field} 
                                onValueChange={(value) => updateFilter(group.id, filter.id, 'field', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="keywords">Keywords</SelectItem>
                                  <SelectItem value="vendor">Vendor</SelectItem>
                                  <SelectItem value="category">Category</SelectItem>
                                  <SelectItem value="product">Product</SelectItem>
                                  <SelectItem value="language">Language</SelectItem>
                                  <SelectItem value="duration">Duration</SelectItem>
                                  <SelectItem value="assetType">Asset Type</SelectItem>
                                  <SelectItem value="createdOn">Created On</SelectItem>
                                  <SelectItem value="publishedTo">Published To</SelectItem>
                                  <SelectItem value="videoId">Video ID</SelectItem>
                                  <SelectItem value="priority">Priority</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select 
                                value={filter.operator} 
                                onValueChange={(value) => updateFilter(group.id, filter.id, 'operator', value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="startsWith">Starts With</SelectItem>
                                  <SelectItem value="endsWith">Ends With</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                                onChange={(e) => updateFilter(group.id, filter.id, 'value', e.target.value)}
                                className="flex-1 bg-control-surface border-border text-foreground"
                              />
                              <Button size="sm" variant="ghost" onClick={() => removeFilter(group.id, filter.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addFilterGroup}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter Group
                    </Button>
                  </div>
                </div>

                {/* Preview Panel */}
                <div>
                  <h3 className="font-medium mb-4">Live Preview</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded bg-control-surface">
                      <div className="text-2xl font-bold text-broadcast-blue">~{Math.floor(Math.random() * 100) + 50}</div>
                      <div className="text-sm text-muted-foreground">Assets matching current rules</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Sample Items</span>
                        <Button variant="ghost" size="sm">View All</Button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {mockAssets.slice(0, 5).map((asset) => (
                          <div key={asset.id} className="p-2 border border-border rounded text-sm">
                            <div className="font-medium">{asset.title}</div>
                            <div className="text-muted-foreground">{asset.duration}m • {asset.vendor}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Common Controls */}
      <Card className="bg-card-dark border-border">
        <CardHeader>
          <CardTitle>Playlist Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dedupe Window</Label>
              <Select value={dedupeWindow} onValueChange={setDedupeWindow}>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="48h">48 hours</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fallback Strategy</Label>
              <Select value={fallbackStrategy} onValueChange={setFallbackStrategy}>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Loop">Loop</SelectItem>
                  <SelectItem value="Slate">Slate</SelectItem>
                  <SelectItem value="Filler Playlist">Filler Playlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
