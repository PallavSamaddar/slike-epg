import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  X, 
  Search, 
  Filter, 
  GripVertical, 
  Play, 
  Clock, 
  Eye,
  Save,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';

interface Asset {
  id: string;
  title: string;
  duration: number; // in minutes
  type: 'Video' | 'Shorts' | 'Vertical Video' | 'Live Recording' | 'Audio';
  vendor: string;
  createdAt: string;
  thumbnail?: string;
}

interface PlaylistItem {
  id: string;
  asset: Asset;
  order: number;
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
  value: any;
  label: string;
}

interface Props {
  onNavigate?: (view: string) => void;
  playlistId?: string;
  isEdit?: boolean;
}

const PlaylistCreateEdit = ({ onNavigate, playlistId, isEdit = false }: Props) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [dedupeWindow, setDedupeWindow] = useState('none');
  const [fallbackStrategy, setFallbackStrategy] = useState('loop');
  
  // Basic mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVendor, setSearchVendor] = useState('');
  const [searchType, setSearchType] = useState('');
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  // Advanced mode state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { id: '1', type: 'include', filters: [] }
  ]);
  const [previewAssets, setPreviewAssets] = useState<Asset[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  
  // Common state
  const [isDraft, setIsDraft] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Dummy data
  const vendors = ['ANI', 'AFP', 'TOI', 'NBT', 'Reuters', 'BBC'];
  const assetTypes = ['Video', 'Shorts', 'Vertical Video', 'Live Recording', 'Audio'];
  const categories = ['News', 'Sports', 'Entertainment', 'Finance', 'Lifestyle'];
  const products = ['TOI', 'Languages', 'ET Online', 'IndiaTimes'];
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati'];
  const publishedTo = ['Denmark', 'YouTube', 'Facebook'];
  const priorities = ['Latest', 'Trending', 'Top Viewed'];

  useEffect(() => {
    generateDummyAssets();
    if (isEdit && playlistId) {
      loadPlaylistData();
    }
  }, [isEdit, playlistId]);

  const generateDummyAssets = () => {
    const assets: Asset[] = Array.from({ length: 50 }, (_, i) => ({
      id: `asset-${i + 1}`,
      title: `Sample Asset ${i + 1}`,
      duration: Math.floor(Math.random() * 30) + 1,
      type: assetTypes[Math.floor(Math.random() * assetTypes.length)] as any,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    setAvailableAssets(assets);
  };

  const loadPlaylistData = () => {
    // Simulate loading playlist data
    setPlaylistName('Sample Playlist');
    setPlaylistDescription('A sample playlist for testing');
    setMode('basic');
  };

  const filteredAssets = availableAssets.filter(asset => {
    const matchesQuery = !searchQuery || asset.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = !searchVendor || asset.vendor === searchVendor;
    const matchesType = !searchType || asset.type === searchType;
    return matchesQuery && matchesVendor && matchesType;
  });

  const handleAddAsset = (asset: Asset) => {
    if (!playlistItems.find(item => item.asset.id === asset.id)) {
      const newItem: PlaylistItem = {
        id: `item-${Date.now()}`,
        asset,
        order: playlistItems.length
      };
      setPlaylistItems(prev => [...prev, newItem]);
      toast.success('Asset added to playlist');
    }
  };

  const handleRemoveAsset = (itemId: string) => {
    setPlaylistItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Asset removed from playlist');
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPlaylistItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      type: 'include',
      filters: []
    };
    setFilterGroups(prev => [...prev, newGroup]);
  };

  const removeFilterGroup = (groupId: string) => {
    setFilterGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const addFilter = (groupId: string, field: string) => {
    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      field,
      operator: 'contains',
      value: '',
      label: `${field} contains`
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

  const updateFilter = (groupId: string, filterId: string, updates: Partial<Filter>) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            filters: group.filters.map(f => 
              f.id === filterId ? { ...f, ...updates } : f
            )
          }
        : group
    ));
  };

  const calculatePreview = () => {
    // Simulate advanced filtering
    const count = Math.floor(Math.random() * 100) + 10;
    setPreviewCount(count);
    
    const sampleAssets = availableAssets.slice(0, Math.min(20, count));
    setPreviewAssets(sampleAssets);
  };

  useEffect(() => {
    if (mode === 'advanced') {
      calculatePreview();
    }
  }, [filterGroups, mode]);

  const handleSaveDraft = () => {
    setIsDraft(true);
    toast.success('Draft saved successfully');
  };

  const handleActivate = () => {
    if (!playlistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    if (mode === 'basic' && playlistItems.length === 0) {
      toast.error('Please add at least one asset to the playlist');
      return;
    }
    
    if (mode === 'advanced' && filterGroups.every(group => group.filters.length === 0)) {
      toast.error('Please add at least one filter rule');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setIsActivated(true);
      setLoading(false);
      toast.success('Playlist activated successfully');
    }, 1000);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateTotalDuration = () => {
    return playlistItems.reduce((total, item) => total + item.asset.duration, 0);
  };

  const simulateSlotFill = (slotMinutes: number) => {
    const totalDuration = calculateTotalDuration();
    const fillPercentage = Math.min((totalDuration / slotMinutes) * 100, 100);
    return Math.round(fillPercentage);
  };

  // Action buttons for header
  const actionButtons = (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        onClick={handleSaveDraft}
        disabled={isDraft}
      >
        <Save className="h-4 w-4 mr-2" />
        {isDraft ? 'Draft Saved' : 'Save Draft'}
      </Button>
      <Button 
        onClick={handleActivate}
        disabled={loading || isActivated}
        className="bg-primary hover:bg-primary/90"
      >
        <Zap className="h-4 w-4 mr-2" />
        {loading ? 'Activating...' : isActivated ? 'Activated' : 'Activate'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <PageHeader 
        title={isEdit ? 'Edit Playlist' : 'Create Playlist'}
        showBackToPlaylists={true}
        onBackToPlaylists={() => onNavigate?.('playlists')}
        rightContent={actionButtons}
      />

      {/* Basic Info */}
      <Card className="bg-card-dark border-border mb-6">
        <CardHeader>
          <CardTitle>Playlist Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Playlist Name *</Label>
            <Input
              id="name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="bg-control-surface border-border text-foreground"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={playlistDescription}
              onChange={(e) => setPlaylistDescription(e.target.value)}
              placeholder="Enter playlist description"
              className="bg-control-surface border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode Selector */}
      <Card className="bg-card-dark border-border mb-6">
        <CardHeader>
          <CardTitle>Playlist Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'basic' | 'advanced')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic (Manual)</TabsTrigger>
              <TabsTrigger value="advanced">Advanced (Rule-based)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Search Panel */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Search Assets</h3>
                  
                  <div>
                    <Label>Search Keywords</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-control-surface border-border text-foreground"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Vendor</Label>
                    <Select value={searchVendor} onValueChange={setSearchVendor}>
                      <SelectTrigger className="bg-control-surface border-border text-foreground">
                        <SelectValue placeholder="All vendors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All vendors</SelectItem>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Asset Type</Label>
                    <Select value={searchType} onValueChange={setSearchType}>
                      <SelectTrigger className="bg-control-surface border-border text-foreground">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        {assetTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Search Results</h3>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssets.slice(0, 10).map((asset) => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.title}</TableCell>
                            <TableCell>{formatDuration(asset.duration)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{asset.type}</Badge>
                            </TableCell>
                            <TableCell>{asset.vendor}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleAddAsset(asset)}
                                disabled={playlistItems.some(item => item.asset.id === asset.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Playlist Order Panel */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Playlist Order</h3>
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={playlistItems.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {playlistItems.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onRemove={handleRemoveAsset}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  
                  {playlistItems.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No assets added yet
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Filter Composer */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Filter Composer</h3>
                  
                  {filterGroups.map((group) => (
                    <Card key={group.id} className="bg-control-surface border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={group.type === 'include'}
                              onCheckedChange={(checked) => 
                                setFilterGroups(prev => prev.map(g => 
                                  g.id === group.id 
                                    ? { ...g, type: checked ? 'include' : 'exclude' }
                                    : g
                                ))
                              }
                            />
                            <span className="font-medium">
                              {group.type === 'include' ? 'Include' : 'Exclude'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFilterGroup(group.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {group.filters.map((filter) => (
                          <div key={filter.id} className="flex items-center space-x-2">
                            <Select
                              value={filter.field}
                              onValueChange={(value) => updateFilter(group.id, filter.id, { field: value })}
                            >
                              <SelectTrigger className="w-32 bg-control-surface border-border">
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
                            <Input
                              placeholder="Enter value"
                              value={filter.value}
                              onChange={(e) => updateFilter(group.id, filter.id, { value: e.target.value })}
                              className="flex-1 bg-control-surface border-border text-foreground"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFilter(group.id, filter.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addFilter(group.id, 'keywords')}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Filter
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addFilterGroup}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter Group
                  </Button>
                </div>

                {/* Preview Panel */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preview</h3>
                  
                  <Card className="bg-control-surface border-border">
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-primary">{previewCount}</div>
                        <div className="text-sm text-muted-foreground">Assets Found</div>
                      </div>
                      
                      {previewCount === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>No assets match your filters</p>
                          <p className="text-xs">Try adjusting your filter criteria</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm font-medium mb-2">Sample Items (Top 20):</div>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {previewAssets.map((asset) => (
                              <div key={asset.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{asset.title}</span>
                                <span className="text-muted-foreground">{formatDuration(asset.duration)}</span>
                              </div>
                            ))}
                          </div>
                          {previewCount > 20 && (
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View All {previewCount} Items
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Common Controls */}
      <Card className="bg-card-dark border-border mb-6">
        <CardHeader>
          <CardTitle>Playlist Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Dedupe Window</Label>
            <Select value={dedupeWindow} onValueChange={setDedupeWindow}>
              <SelectTrigger className="bg-control-surface border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
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
                <SelectItem value="loop">Loop</SelectItem>
                <SelectItem value="slate">Slate</SelectItem>
                <SelectItem value="filler">Filler Playlist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview (Basic Mode) */}
      {mode === 'basic' && (
        <Card className="bg-card-dark border-border">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[30, 60, 120].map((minutes) => {
                const fillPercentage = simulateSlotFill(minutes);
                return (
                  <div key={minutes} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{minutes}-min slot</span>
                      <span className="text-sm text-muted-foreground">{fillPercentage}% filled</span>
                    </div>
                    <div className="w-full bg-control-surface rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(calculateTotalDuration())} / {formatDuration(minutes)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Sortable Item Component
const SortableItem = ({ item, onRemove }: { item: PlaylistItem; onRemove: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-2 bg-control-surface border border-border rounded ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.asset.title}</div>
        <div className="text-xs text-muted-foreground">
          {item.asset.vendor} • {item.asset.type} • {Math.floor(item.asset.duration / 60)}m
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PlaylistCreateEdit;