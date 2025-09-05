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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Save,
  Zap,
  AlertCircle,
  Check,
  CheckCircle,
  GripVertical,
  Eye,
  Filter,
  Calendar,
  Clock,
  Tag,
  Globe,
  Star
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';

interface Asset {
  id: string;
  title: string;
  duration: number; // in minutes
  type: 'Video' | 'Shorts' | 'Vertical Video' | 'Live Recording' | 'Audio';
  vendor: string;
  category: string;
  product: string;
  language: string;
  createdAt: string;
  publishedTo: string[];
  videoId: string;
  priority: string;
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

const PlaylistCreateEditComplete = ({ onNavigate, playlistId, isEdit = false }: Props) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [dedupeWindow, setDedupeWindow] = useState('none');
  const [fallbackStrategy, setFallbackStrategy] = useState('loop');
  const [ordering, setOrdering] = useState('manual');
  
  // Basic mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVendor, setSearchVendor] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  
  // Advanced mode state
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { 
      id: '1', 
      type: 'include', 
      filters: [
        {
          id: 'default-filter-1',
          field: 'keywords',
          operator: 'contains',
          value: '',
          label: 'keywords contains'
        }
      ]
    }
  ]);
  const [previewAssets, setPreviewAssets] = useState<Asset[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  
  // Common state
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Keyword autosuggest state - per filter row
  const [filterKeywordStates, setFilterKeywordStates] = useState<Record<string, {
    suggestions: string[];
    showSuggestions: boolean;
    selectedKeywords: string[];
    highlightedIndex: number;
    inputValue: string;
  }>>({
    'default-filter-1': {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Data options
  const vendors = ['ANI', 'AFP', 'TOI', 'NBT'];
  const assetTypes = ['Video', 'Shorts', 'Vertical Video', 'Live Recording', 'Audio'];
  const categories = ['News', 'Sports', 'Entertainment', 'Finance', 'Lifestyle'];
  const products = ['TOI', 'Languages', 'ET Online', 'IndiaTimes'];
  const languages = ['Hindi', 'English', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi'];
  const publishedTo = ['Denmark', 'YouTube', 'Facebook'];
  const priorities = ['Latest', 'Trending', 'Top Viewed'];
  const keywordLibrary = [
    'cricket', 'highlights', 'breaking news', 'bollywood', 'politics', 'stock market', 'IPL', 'world cup', 
    'weather', 'elections', 'interview', 'analysis', 'explainer', 'tech review', 'gadget', 'smartphone', 
    'startup', 'finance tips', 'viral', 'travel', 'food', 'health'
  ];
  const durationPresets = [
    { label: 'Above 2 mins', value: '2+' },
    { label: 'Above 5 mins', value: '5+' },
    { label: 'Above 10 mins', value: '10+' },
    { label: 'Above 15 mins', value: '15+' }
  ];
  const createdOnPresets = [
    { label: 'Today', value: 'today' },
    { label: '7 days', value: '7d' },
    { label: '15 days', value: '15d' },
    { label: '30 days', value: '30d' },
    { label: 'Custom', value: 'custom' }
  ];

  useEffect(() => {
    generateDummyAssets();
    if (isEdit && playlistId) {
      loadPlaylistData();
    }
  }, [isEdit, playlistId]);

  const generateDummyAssets = () => {
    const assets: Asset[] = Array.from({ length: 100 }, (_, i) => ({
      id: `asset-${i + 1}`,
      title: `Sample Asset ${i + 1} - ${categories[Math.floor(Math.random() * categories.length)]}`,
      duration: Math.floor(Math.random() * 30) + 1,
      type: assetTypes[Math.floor(Math.random() * assetTypes.length)] as any,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      product: products[Math.floor(Math.random() * products.length)],
      language: languages[Math.floor(Math.random() * languages.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      publishedTo: publishedTo.slice(0, Math.floor(Math.random() * 3) + 1),
      videoId: `VID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
    }));
    setAvailableAssets(assets);
  };

  const loadPlaylistData = () => {
    setPlaylistName('Sample Playlist');
    setPlaylistDescription('A sample playlist for testing');
    setMode('basic');
  };

  const filteredAssets = availableAssets.filter(asset => {
    const matchesQuery = !searchQuery || asset.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = !searchVendor || searchVendor === 'all' || asset.vendor === searchVendor;
    const matchesType = !searchType || searchType === 'all' || asset.type === searchType;
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

  // Advanced mode filter functions
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

  const addFilter = (groupId: string, field: string = 'keywords') => {
    const filterId = `filter-${Date.now()}`;
    const newFilter: Filter = {
      id: filterId,
      field,
      operator: 'contains',
      value: '',
      label: `${field} contains`
    };
    
    // Initialize keyword state for this filter
    setFilterKeywordStates(prev => ({
      ...prev,
      [filterId]: {
        suggestions: [],
        showSuggestions: false,
        selectedKeywords: [],
        highlightedIndex: -1,
        inputValue: ''
      }
    }));
    
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, filters: [...group.filters, newFilter] }
        : group
    ));
  };

  const removeFilter = (groupId: string, filterId: string) => {
    // Clean up keyword state for this filter
    setFilterKeywordStates(prev => {
      const newState = { ...prev };
      delete newState[filterId];
      return newState;
    });
    
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, filters: group.filters.filter(f => f.id !== filterId) }
        : group
    ));
  };

  const updateFilter = (groupId: string, filterId: string, updates: Partial<Filter>) => {
    // If field is changing, reset the secondary control state
    if (updates.field) {
      setFilterKeywordStates(prev => ({
        ...prev,
        [filterId]: {
          suggestions: [],
          showSuggestions: false,
          selectedKeywords: [],
          highlightedIndex: -1,
          inputValue: ''
        }
      }));
    }
    
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
    const count = Math.floor(Math.random() * 200) + 10;
    setPreviewCount(count);
    
    const sampleAssets = availableAssets.slice(0, Math.min(20, count));
    setPreviewAssets(sampleAssets);
  };

  useEffect(() => {
    if (mode === 'advanced') {
      calculatePreview();
    }
  }, [filterGroups, mode]);

  const handleSavePlaylist = () => {
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
      setLoading(false);
      toast.success('Playlist saved successfully');
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

  const getFieldOptions = (field: string) => {
    switch (field) {
      case 'vendor': return vendors;
      case 'category': return categories;
      case 'product': return products;
      case 'language': return languages;
      case 'assetType': return assetTypes;
      case 'publishedTo': return publishedTo;
      case 'priority': return priorities;
      case 'duration': return durationPresets;
      case 'createdOn': return createdOnPresets;
      default: return [];
    }
  };

  const handleKeywordInput = (filterId: string, value: string) => {
    const currentState = filterKeywordStates[filterId] || {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    };
    
    if (value.length > 0) {
      const suggestions = keywordLibrary.filter(keyword => 
        keyword.toLowerCase().includes(value.toLowerCase()) && 
        !currentState.selectedKeywords.includes(keyword)
      ).slice(0, 5);
      
      setFilterKeywordStates(prev => ({
        ...prev,
        [filterId]: {
          ...currentState,
          inputValue: value,
          suggestions,
          showSuggestions: true,
          highlightedIndex: -1
        }
      }));
    } else {
      setFilterKeywordStates(prev => ({
        ...prev,
        [filterId]: {
          ...currentState,
          inputValue: value,
          showSuggestions: false
        }
      }));
    }
  };

  const addKeywordChip = (filterId: string, keyword: string) => {
    const currentState = filterKeywordStates[filterId] || {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    };
    
    if (!currentState.selectedKeywords.includes(keyword)) {
      setFilterKeywordStates(prev => ({
        ...prev,
        [filterId]: {
          ...currentState,
          selectedKeywords: [...currentState.selectedKeywords, keyword],
          inputValue: '',
          showSuggestions: false,
          highlightedIndex: -1
        }
      }));
    }
  };

  const removeKeywordChip = (filterId: string, keyword: string) => {
    const currentState = filterKeywordStates[filterId] || {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    };
    
    setFilterKeywordStates(prev => ({
      ...prev,
      [filterId]: {
        ...currentState,
        selectedKeywords: currentState.selectedKeywords.filter(k => k !== keyword)
      }
    }));
  };

  const handleKeywordKeyDown = (filterId: string, e: React.KeyboardEvent) => {
    const currentState = filterKeywordStates[filterId] || {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    };
    
    if (!currentState.showSuggestions || currentState.suggestions.length === 0) {
      if (e.key === 'Enter' && currentState.inputValue.trim()) {
        addKeywordChip(filterId, currentState.inputValue.trim());
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFilterKeywordStates(prev => ({
          ...prev,
          [filterId]: {
            ...currentState,
            highlightedIndex: currentState.highlightedIndex < currentState.suggestions.length - 1 
              ? currentState.highlightedIndex + 1 
              : 0
          }
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFilterKeywordStates(prev => ({
          ...prev,
          [filterId]: {
            ...currentState,
            highlightedIndex: currentState.highlightedIndex > 0 
              ? currentState.highlightedIndex - 1 
              : currentState.suggestions.length - 1
          }
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (currentState.highlightedIndex >= 0 && currentState.highlightedIndex < currentState.suggestions.length) {
          addKeywordChip(filterId, currentState.suggestions[currentState.highlightedIndex]);
        } else if (currentState.inputValue.trim()) {
          addKeywordChip(filterId, currentState.inputValue.trim());
        }
        break;
      case 'Escape':
        setFilterKeywordStates(prev => ({
          ...prev,
          [filterId]: {
            ...currentState,
            showSuggestions: false,
            highlightedIndex: -1
          }
        }));
        break;
    }
  };

  const handleKeywordFocus = (filterId: string) => {
    const currentState = filterKeywordStates[filterId] || {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    };
    
    if (currentState.inputValue.length > 0) {
      const suggestions = keywordLibrary.filter(keyword => 
        keyword.toLowerCase().includes(currentState.inputValue.toLowerCase()) && 
        !currentState.selectedKeywords.includes(keyword)
      ).slice(0, 5);
      
      setFilterKeywordStates(prev => ({
        ...prev,
        [filterId]: {
          ...currentState,
          suggestions,
          showSuggestions: true
        }
      }));
    }
  };

  // Asset List Item Component
  const AssetListItem = ({ asset, onAdd, isInPlaylist }: { asset: Asset, onAdd: () => void, isInPlaylist: boolean }) => {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F6FB] transition-colors group">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#1F2937] truncate" title={asset.title}>
            {asset.title}
          </h4>
          <p className="text-sm text-[#6B7280]">
            {asset.vendor} • {asset.type} • {formatDuration(asset.duration)} • {new Date(asset.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isInPlaylist ? (
          <div 
            className="flex items-center gap-2 text-[#6B7280] text-sm cursor-default"
            title="Already in Playlist"
          >
            <Check className="h-4 w-4" />
            <span>Added</span>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={onAdd}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
    );
  };

  // Playlist Order Item Component
  const PlaylistOrderItem = ({ item, index, onRemove }: { item: PlaylistItem, index: number, onRemove: (id: string) => void }) => {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F6FB] transition-colors group">
        <div className="text-[#6B7280] cursor-grab hover:text-[#1F2937]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </div>
        <div className="bg-[#F3F6FB] text-[#6B7280] text-xs px-2 py-1 rounded-full font-medium min-w-[24px] text-center">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#1F2937] truncate" title={item.asset.title}>
            {item.asset.title}
          </h4>
          <p className="text-sm text-[#6B7280]">
            {item.asset.vendor} • {item.asset.type} • {formatDuration(item.asset.duration)}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#6B7280] hover:text-[#DC2626]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderFilterField = (filter: Filter, groupId: string) => {
    const options = getFieldOptions(filter.field);
    const keywordState = filterKeywordStates[filter.id] || {
      suggestions: [],
      showSuggestions: false,
      selectedKeywords: [],
      highlightedIndex: -1,
      inputValue: ''
    };
    
    if (filter.field === 'keywords') {
      return (
        <div className="flex-1 relative">
          <div className="min-h-[40px] p-2 border border-gray-300 rounded-md bg-control-surface flex flex-wrap gap-1 items-center">
            {keywordState.selectedKeywords.map((keyword, index) => (
              <div
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeywordChip(filter.id, keyword)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
            <Input
              placeholder="Type keywords here..."
              value={keywordState.inputValue}
              onChange={(e) => handleKeywordInput(filter.id, e.target.value)}
              onKeyDown={(e) => handleKeywordKeyDown(filter.id, e)}
              onFocus={() => handleKeywordFocus(filter.id)}
              className="flex-1 min-w-[120px] border-0 bg-transparent focus:ring-0 focus:outline-none"
            />
          </div>
          {keywordState.showSuggestions && keywordState.suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {keywordState.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    index === keywordState.highlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => addKeywordChip(filter.id, suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (filter.field === 'videoId') {
      return (
        <Input
          placeholder="Type Video ID here"
          value={filter.value}
          onChange={(e) => updateFilter(groupId, filter.id, { value: e.target.value })}
          className="flex-1 bg-control-surface border-border text-foreground"
        />
      );
    }
    
    if (filter.field === 'duration') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 bg-control-surface border-border">
            <SelectValue placeholder="Select Duration" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (filter.field === 'createdOn') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 bg-control-surface border-border">
            <SelectValue placeholder="Select Creation Day" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    // Multi-select for vendor, category, language
    if (filter.field === 'vendor') {
      return (
        <div className="flex-1">
          <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
            <SelectTrigger className="bg-control-surface border-border">
              <SelectValue placeholder="Select Vendor" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    if (filter.field === 'category') {
      return (
        <div className="flex-1">
          <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
            <SelectTrigger className="bg-control-surface border-border">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    if (filter.field === 'language') {
      return (
        <div className="flex-1">
          <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
            <SelectTrigger className="bg-control-surface border-border">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    // Single-select for product, assetType, publishedTo, priority
    if (filter.field === 'product') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 bg-control-surface border-border">
            <SelectValue placeholder="Select Product" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (filter.field === 'assetType') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 bg-control-surface border-border">
            <SelectValue placeholder="Select Asset Type" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (filter.field === 'publishedTo') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 bg-control-surface border-border">
            <SelectValue placeholder="Select Destination" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (filter.field === 'priority') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 bg-control-surface border-border">
            <SelectValue placeholder="Select Priority" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    // Default fallback
    return (
      <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
        <SelectTrigger className="flex-1 bg-control-surface border-border">
          <SelectValue placeholder={`Select ${filter.field}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option: string) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-foreground p-6">
      <PageHeader 
        title={isEdit ? 'Edit Playlist' : 'Create Playlist'}
        subtitle={isEdit ? 'Modify your playlist settings and content' : 'Create a new playlist for your content'}
      />
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => onNavigate?.('playlists')}>
            ← Back to Playlists
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="active-toggle" className="text-sm font-medium">
              {isActive ? 'Active' : 'Inactive'}
            </Label>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <Button 
            onClick={handleSavePlaylist}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Playlist'}
          </Button>
        </div>
      </div>

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
              {/* Responsive 3-column grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Search Assets - 25% (3 columns) */}
                <div className="lg:col-span-3">
                  <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Search Assets</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="search" className="text-sm font-medium text-[#1F2937]">Search</Label>
                          <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                            <Input
                              id="search"
                              placeholder="Search assets..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                            />
                          </div>
                        </div>
                        <div className="border-t border-[#EEF1F6] pt-4">
                          <Label htmlFor="vendor" className="text-sm font-medium text-[#1F2937]">Vendor</Label>
                          <Select value={searchVendor} onValueChange={setSearchVendor}>
                            <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                              <SelectValue placeholder="All vendors" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All vendors</SelectItem>
                              {vendors.map(vendor => (
                                <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="border-t border-[#EEF1F6] pt-4">
                          <Label htmlFor="type" className="text-sm font-medium text-[#1F2937]">Type</Label>
                          <Select value={searchType} onValueChange={setSearchType}>
                            <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All types</SelectItem>
                              {assetTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Search Results - 40% (5 columns) */}
                <div className="lg:col-span-5">
                  <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Search Results</h3>

                      {/* Results List */}
                      <div className="space-y-1 max-h-[600px] overflow-y-auto">
                        {filteredAssets.length === 0 ? (
                          <div className="text-center py-8 text-[#6B7280]">
                            <p>No assets found. Try adjusting filters.</p>
                          </div>
                        ) : (
                          filteredAssets.map(asset => (
                            <AssetListItem
                              key={asset.id}
                              asset={asset}
                              onAdd={() => handleAddAsset(asset)}
                              isInPlaylist={playlistItems.some(item => item.asset.id === asset.id)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Playlist Order - 35% (4 columns) */}
                <div className="lg:col-span-4">
                  <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Playlist Order</h3>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={playlistItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-1 max-h-[600px] overflow-y-auto">
                            {playlistItems.length === 0 ? (
                              <div className="border-2 border-dashed border-[#B9D2FF] rounded-lg p-8 text-center text-[#6B7280]">
                                <p>Drag assets here to build your playlist</p>
                              </div>
                            ) : (
                              playlistItems.map((item, index) => (
                                <PlaylistOrderItem
                                  key={item.id}
                                  item={item}
                                  index={index}
                                  onRemove={handleRemoveAsset}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>

                      {/* Footer with totals */}
                      {playlistItems.length > 0 && (
                        <div className="border-t border-[#EEF1F6] pt-3 mt-4">
                          <div className="flex justify-between text-sm text-[#6B7280]">
                            <span>Total items: {playlistItems.length}</span>
                            <span>Duration: {formatDuration(calculateTotalDuration())}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
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
                            {renderFilterField(filter, group.id)}
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

      {/* Basic Mode Controls */}
      {mode === 'basic' && (
        <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5 mb-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Playlist Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-[#1F2937]">Ordering</Label>
                <Select value={ordering} onValueChange={setOrdering}>
                  <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="chronological">Chronological</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-[#1F2937]">Dedupe Window</Label>
                <Select value={dedupeWindow} onValueChange={setDedupeWindow}>
                  <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
                <Label className="text-sm font-medium text-[#1F2937]">Fallback Strategy</Label>
                <Select value={fallbackStrategy} onValueChange={setFallbackStrategy}>
                  <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loop">Loop</SelectItem>
                    <SelectItem value="slate">Slate</SelectItem>
                    <SelectItem value="filler">Filler Playlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Preview (Basic Mode) */}
      {mode === 'basic' && (
        <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[30, 60, 120].map((minutes) => {
                const fillPercentage = simulateSlotFill(minutes);
                return (
                  <div key={minutes} className="text-center p-4 bg-[#F7F9FC] rounded-lg">
                    <div className="text-2xl font-bold text-[#1F2937]">{minutes} min</div>
                    <div className="text-sm text-[#6B7280]">Slot</div>
                    <div className="mt-2">
                      <div className="w-full bg-[#E6E8EF] rounded-full h-2">
                        <div 
                          className="bg-[#3B82F6] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${fillPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">
                        {fillPercentage}% filled
                      </div>
                    </div>
                    <div className="text-xs text-[#6B7280] mt-2">
                      {formatDuration(calculateTotalDuration())} / {formatDuration(minutes)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Common Controls (Advanced Mode) */}
      {mode === 'advanced' && (
        <Card className="bg-card-dark border-border">
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

export default PlaylistCreateEditComplete;
