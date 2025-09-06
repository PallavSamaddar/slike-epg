import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Copy,
  HelpCircle,
  Settings,
  Star,
  Loader2
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
  updatedAt?: string;
  publishedTo: string[];
  videoId: string;
  priority?: string;
  isLive?: boolean;
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
  const [mode, setMode] = useState<'basic' | 'advanced' | 'preview'>('basic');
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

  // RHS Settings state
  const [isActive, setIsActive] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [duration, setDuration] = useState(90); // in minutes, default 1.5h
  const [refreshFrequency, setRefreshFrequency] = useState('manual');
  const [duplicateChecker, setDuplicateChecker] = useState('no-duplicates');
  const [shortsPlaylist, setShortsPlaylist] = useState(false);
  const [shufflePlaylist, setShufflePlaylist] = useState(false);
  const [podcast, setPodcast] = useState(false);
  const [hlsUrl, setHlsUrl] = useState(false);
  const [mp4Url, setMp4Url] = useState('1080p');
  const [recommendation, setRecommendation] = useState(false);
  
  // RHS Settings tracking
  const [lastSavedSettings, setLastSavedSettings] = useState({
    playlistName: '',
    playlistDescription: '',
    isActive: true,
    sortBy: 'newest',
    duration: 90,
    refreshFrequency: 'manual',
    duplicateChecker: 'no-duplicates',
    shortsPlaylist: false,
    shufflePlaylist: false,
    podcast: false,
    hlsUrl: false,
    mp4Url: '1080p',
    recommendation: false
  });
  const [lastSavedTime, setLastSavedTime] = useState(new Date());
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  
  // Playlist ID for display
  const [playlistIdDisplay, setPlaylistIdDisplay] = useState(playlistId || `PL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);

  // Preview Results state for Advance mode
  const [previewResults, setPreviewResults] = useState<PlaylistItem[]>([]);
  const [excludedAssets, setExcludedAssets] = useState<string[]>([]);
  const [pinnedAssets, setPinnedAssets] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Filter application state
  const [hasUnsavedFilters, setHasUnsavedFilters] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [lastSavedFilters, setLastSavedFilters] = useState(JSON.stringify(filterGroups));
  const [previewAssets, setPreviewAssets] = useState<Asset[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // RHS panel state
  const [isRhsOpen, setIsRhsOpen] = useState(false);
  
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

  // Track unsaved settings changes
  useEffect(() => {
    const hasChanges = 
      playlistName !== lastSavedSettings.playlistName ||
      playlistDescription !== lastSavedSettings.playlistDescription ||
      isActive !== lastSavedSettings.isActive ||
      sortBy !== lastSavedSettings.sortBy ||
      duration !== lastSavedSettings.duration ||
      refreshFrequency !== lastSavedSettings.refreshFrequency ||
      duplicateChecker !== lastSavedSettings.duplicateChecker ||
      shortsPlaylist !== lastSavedSettings.shortsPlaylist ||
      shufflePlaylist !== lastSavedSettings.shufflePlaylist ||
      podcast !== lastSavedSettings.podcast ||
      hlsUrl !== lastSavedSettings.hlsUrl ||
      mp4Url !== lastSavedSettings.mp4Url ||
      recommendation !== lastSavedSettings.recommendation;
    
    setHasUnsavedSettings(hasChanges);
  }, [
    playlistName, playlistDescription, isActive, sortBy, duration, refreshFrequency, duplicateChecker, shortsPlaylist, 
    shufflePlaylist, podcast, hlsUrl, mp4Url, recommendation, lastSavedSettings
  ]);

  // Update relative time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSavedTime(new Date(lastSavedTime.getTime()));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [lastSavedTime]);

  // Copy playlist ID to clipboard
  const handleCopyPlaylistId = async () => {
    try {
      await navigator.clipboard.writeText(playlistIdDisplay);
      toast.success('Playlist ID copied');
    } catch (err) {
      toast.error('Failed to copy Playlist ID');
    }
  };

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
    
    // Update last saved settings
    setLastSavedSettings({
      playlistName,
      playlistDescription,
      isActive,
      sortBy,
      duration,
      refreshFrequency,
      duplicateChecker,
      shortsPlaylist,
      shufflePlaylist,
      podcast,
      hlsUrl,
      mp4Url,
      recommendation
    });
    
    // Update last saved time
    setLastSavedTime(new Date());
    
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

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Format absolute time
  const formatAbsoluteTime = (date: Date | undefined): string => {
    if (!date) return 'never';
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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

  // Helper functions for Advance mode
  const calculatePreviewDuration = () => {
    return previewResults.reduce((total, item) => total + item.asset.duration, 0);
  };

  const handlePreviewDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPreviewResults((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUnifiedDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const allItems = [...playlistItems, ...previewResults];
      const oldIndex = allItems.findIndex((item) => item.id === active.id);
      const newIndex = allItems.findIndex((item) => item.id === over.id);
      
      const reorderedItems = arrayMove(allItems, oldIndex, newIndex);
      const basicCount = playlistItems.length;
      
      if (newIndex < basicCount) {
        // Moved to Basic section
        setPlaylistItems(reorderedItems.slice(0, basicCount));
        setPreviewResults(reorderedItems.slice(basicCount));
      } else {
        // Moved to Advance section
        setPlaylistItems(reorderedItems.slice(0, basicCount));
        setPreviewResults(reorderedItems.slice(basicCount));
      }
    }
  };

  const handlePinAsset = (assetId: string) => {
    setPinnedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleRemoveFromPreview = (assetId: string) => {
    setExcludedAssets(prev => [...prev, assetId]);
    setPreviewResults(prev => prev.filter(item => item.asset.id !== assetId));
  };

  // Filter resolution logic
  const resolveFilters = async () => {
    setIsApplyingFilters(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all available assets
      const allAssets = availableAssets;
      
      // Apply filters (simplified logic for demo)
      let filteredAssets = allAssets.filter(asset => {
        // Check if asset is excluded
        if (excludedAssets.includes(asset.id)) return false;
        
        // Apply filter groups
        for (const group of filterGroups) {
          let groupMatches = true;
          
          for (const filter of group.filters) {
            let filterMatches = false;
            
            switch (filter.field) {
              case 'keywords':
                const keywords = filterKeywordStates[filter.id]?.selectedKeywords || [];
                filterMatches = keywords.length === 0 || keywords.some(keyword => 
                  asset.title.toLowerCase().includes(keyword.toLowerCase())
                );
                break;
              case 'vendor':
                filterMatches = !filter.value || asset.vendor === filter.value;
                break;
              case 'category':
                filterMatches = !filter.value || asset.category === filter.value;
                break;
              case 'product':
                filterMatches = !filter.value || asset.product === filter.value;
                break;
              case 'language':
                filterMatches = !filter.value || asset.language === filter.value;
                break;
              case 'duration':
                filterMatches = !filter.value || asset.duration >= parseInt(filter.value);
                break;
              case 'assetType':
                filterMatches = !filter.value || asset.type === filter.value;
                break;
              case 'createdOn':
                filterMatches = !filter.value || asset.createdAt >= filter.value;
                break;
              case 'publishedTo':
                filterMatches = !filter.value || asset.publishedTo === filter.value;
                break;
              case 'videoId':
                filterMatches = !filter.value || asset.videoId === filter.value;
                break;
              case 'priority':
                filterMatches = !filter.value || asset.priority === filter.value;
                break;
              default:
                filterMatches = true;
            }
            
            if (!filterMatches) {
              groupMatches = false;
              break;
            }
          }
          
          if (group.type === 'include' && !groupMatches) return false;
          if (group.type === 'exclude' && groupMatches) return false;
        }
        
        return true;
      });
      
      // Apply sorting
      filteredAssets = filteredAssets.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'updated':
            return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
          case 'az':
            return a.title.localeCompare(b.title);
          case 'za':
            return b.title.localeCompare(a.title);
          case 'longest':
            return b.duration - a.duration;
          case 'shortest':
            return a.duration - b.duration;
          case 'live':
            return (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0);
          default:
            return 0;
        }
      });
      
      // Apply duration limit (convert duration from minutes to approximate item count)
      // This is a simplified calculation - in real implementation, you'd calculate based on actual asset durations
      const estimatedItemsPerMinute = 2; // Rough estimate
      const maxItems = Math.floor((duration / 60) * estimatedItemsPerMinute);
      if (maxItems > 0) {
        filteredAssets = filteredAssets.slice(0, maxItems);
      }
      
      // Convert to PlaylistItem format
      const newPreviewResults = filteredAssets.map((asset, index) => ({
        id: `preview-${asset.id}`,
        asset,
        addedAt: new Date().toISOString(),
        order: index
      }));
      
      // Preserve pinned items at the top
      const pinnedItems = previewResults.filter(item => pinnedAssets.includes(item.asset.id));
      const unpinnedItems = newPreviewResults.filter(item => !pinnedAssets.includes(item.asset.id));
      
      setPreviewResults([...pinnedItems, ...unpinnedItems]);
      setLastUpdated(new Date());
      
      // Update last saved settings
      setLastSavedSettings({
        playlistName,
        playlistDescription,
        isActive,
        sortBy,
        duration,
        refreshFrequency,
        duplicateChecker,
        shortsPlaylist,
        shufflePlaylist,
        podcast,
        hlsUrl,
        mp4Url,
        recommendation
      });
      
      // Update last saved filters
      setLastSavedFilters(JSON.stringify(filterGroups));
      
      // Reset filter changes tracking
      setHasUnsavedFilters(false);
      
      toast.success(`Filters applied. ${newPreviewResults.length} items resolved.`);
      
    } catch (error) {
      toast.error('No items match your filters.');
    } finally {
      setIsApplyingFilters(false);
    }
  };

  // Check for unsaved changes (including filter changes)
  useEffect(() => {
    // Check if filter groups have been modified
    const currentFiltersString = JSON.stringify(filterGroups);
    const hasFilterChanges = currentFiltersString !== lastSavedFilters;

    // Check if keyword states have been modified
    const hasKeywordChanges = Object.keys(filterKeywordStates).some(filterId => {
      const keywordState = filterKeywordStates[filterId];
      return keywordState && keywordState.selectedKeywords.length > 0;
    });

    // Check if settings have changed
    const hasSettingsChanges = 
      sortBy !== lastSavedSettings.sortBy ||
      duration !== lastSavedSettings.duration ||
      refreshFrequency !== lastSavedSettings.refreshFrequency ||
      duplicateChecker !== lastSavedSettings.duplicateChecker ||
      shortsPlaylist !== lastSavedSettings.shortsPlaylist ||
      shufflePlaylist !== lastSavedSettings.shufflePlaylist ||
      podcast !== lastSavedSettings.podcast ||
      hlsUrl !== lastSavedSettings.hlsUrl ||
      mp4Url !== lastSavedSettings.mp4Url ||
      recommendation !== lastSavedSettings.recommendation;
    
    setHasUnsavedFilters(hasFilterChanges || hasKeywordChanges || hasSettingsChanges);
  }, [filterGroups, filterKeywordStates, lastSavedFilters, sortBy, duration, refreshFrequency, duplicateChecker, shortsPlaylist, shufflePlaylist, podcast, hlsUrl, mp4Url, recommendation, lastSavedSettings]);

  // Keyboard support for Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Enter' && mode === 'advanced' && hasUnsavedFilters && !isApplyingFilters) {
        event.preventDefault();
        resolveFilters();
      }
      if (event.key === 'Escape' && isRhsOpen) {
        setIsRhsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, hasUnsavedFilters, isApplyingFilters, isRhsOpen]);

  // Track unsaved settings changes
  useEffect(() => {
    const hasChanges = 
      playlistName !== lastSavedSettings.playlistName ||
      playlistDescription !== lastSavedSettings.playlistDescription ||
      isActive !== lastSavedSettings.isActive ||
      sortBy !== lastSavedSettings.sortBy ||
      duration !== lastSavedSettings.duration ||
      refreshFrequency !== lastSavedSettings.refreshFrequency ||
      duplicateChecker !== lastSavedSettings.duplicateChecker ||
      shortsPlaylist !== lastSavedSettings.shortsPlaylist ||
      shufflePlaylist !== lastSavedSettings.shufflePlaylist ||
      podcast !== lastSavedSettings.podcast ||
      hlsUrl !== lastSavedSettings.hlsUrl ||
      mp4Url !== lastSavedSettings.mp4Url ||
      recommendation !== lastSavedSettings.recommendation;
    
    setHasUnsavedSettings(hasChanges);
  }, [
    playlistName, playlistDescription, isActive, sortBy, duration, refreshFrequency, duplicateChecker, shortsPlaylist, 
    shufflePlaylist, podcast, hlsUrl, mp4Url, recommendation, lastSavedSettings
  ]);

  // Update relative time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastSavedTime(prev => new Date(prev.getTime()));
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Preview Result Item Component
  const PreviewResultItem = ({ item, index, isPinned, onPin, onRemove }: { 
    item: PlaylistItem, 
    index: number, 
    isPinned: boolean, 
    onPin: () => void, 
    onRemove: (itemId: string) => void 
  }) => {
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
        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F6FB] transition-colors group ${
          isDragging ? 'opacity-50' : ''
        } ${isPinned ? 'bg-[#EAF1FF] border border-[#B9D2FF]' : ''}`}
      >
        <div
          {...attributes}
          {...listeners}
          className="text-[#6B7280] cursor-grab hover:text-[#1F2937]"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </div>
        
        <div className="bg-[#F3F6FB] text-[#6B7280] text-xs px-2 py-1 rounded-full font-medium min-w-[24px] text-center">
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[#1F2937] truncate" title={item.asset.title}>
              {item.asset.title}
            </h4>
            {isPinned && (
              <div className="text-[#3B82F6]" title="Pinned">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-sm text-[#6B7280]">
            {item.asset.vendor} • {item.asset.type} • {formatDuration(item.asset.duration)}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onPin}
            className="h-6 w-6 p-0 text-[#6B7280] hover:text-[#3B82F6]"
            title={isPinned ? "Unpin" : "Pin"}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(item.id)}
            className="h-6 w-6 p-0 text-[#6B7280] hover:text-[#DC2626]"
            title="Remove from Results"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  // Unified Playlist Item Component
  const UnifiedPlaylistItem = ({ item, index, section, onRemove, onPin, isPinned = false }: { 
    item: PlaylistItem, 
    index: number, 
    section: 'basic' | 'advance',
    onRemove: (itemId: string) => void, 
    onPin: () => void,
    isPinned?: boolean
  }) => {
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
        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#F3F6FB] transition-colors group ${
          isDragging ? 'opacity-50' : ''
        } ${isPinned ? 'bg-[#EAF1FF] border border-[#B9D2FF]' : ''}`}
      >
        <div
          {...attributes}
          {...listeners}
          className="text-[#6B7280] cursor-grab hover:text-[#1F2937]"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </div>
        
        <div className="bg-[#F3F6FB] text-[#6B7280] text-xs px-2 py-1 rounded-full font-medium min-w-[24px] text-center">
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[#1F2937] truncate" title={item.asset.title}>
              {item.asset.title}
            </h4>
            {isPinned && (
              <div className="text-[#3B82F6]" title="Pinned">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-xs text-[#6B7280] bg-[#F3F6FB] px-2 py-1 rounded">
              {section}
            </span>
          </div>
          <p className="text-sm text-[#6B7280]">
            {item.asset.vendor} • {item.asset.type} • {formatDuration(item.asset.duration)}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onPin}
            className="h-6 w-6 p-0 text-[#6B7280] hover:text-[#3B82F6]"
            title={isPinned ? "Unpin" : "Pin"}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(item.id)}
            className="h-6 w-6 p-0 text-[#6B7280] hover:text-[#DC2626]"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
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
          <div className="min-h-[32px] p-2 border border-[#E6E8EF] rounded-md bg-white flex flex-wrap gap-1 items-center focus-within:ring-2 focus-within:ring-[#3B82F6] focus-within:ring-offset-2">
            {keywordState.selectedKeywords.map((keyword, index) => (
              <div
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full bg-[#EAF1FF] text-[#1F2937] text-xs"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeywordChip(filter.id, keyword)}
                  className="ml-1 text-[#6B7280] hover:text-[#1F2937]"
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
              className="flex-1 min-w-[120px] border-0 bg-transparent focus:ring-0 focus:outline-none text-xs"
            />
          </div>
          {keywordState.showSuggestions && keywordState.suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-[#E6E8EF] rounded-md shadow-lg max-h-40 overflow-y-auto">
              {keywordState.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 cursor-pointer text-xs ${
                    index === keywordState.highlightedIndex ? 'bg-[#F3F6FB]' : 'hover:bg-[#F3F6FB]'
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
          className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
        />
      );
    }
    
    if (filter.field === 'duration') {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(groupId, filter.id, { value })}>
          <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
          <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
            <SelectTrigger className="h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
              <SelectValue placeholder="Select Vendor" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
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
            <SelectTrigger className="h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
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
            <SelectTrigger className="h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
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
          <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
          <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
          <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
          <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
        <SelectTrigger className="flex-1 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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


  // Determine page title based on route
  const getPageTitle = () => {
    if (isEdit) return 'Edit Playlist';
    return 'Create Playlist';
  };

  // Save button component for header
  const saveButton = (
    <div className="flex items-center space-x-4">
      {/* Mobile/Tablet Settings Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsRhsOpen(!isRhsOpen)}
        className="lg:hidden"
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </Button>
      
      <Button 
        onClick={handleSavePlaylist}
        disabled={loading || !playlistName.trim()}
        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 text-sm font-semibold"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save Playlist'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-foreground">
      <PageHeader 
        title={getPageTitle()}
        showBackToPlaylists={true}
        onBackToPlaylists={() => onNavigate?.('playlists')}
        rightContent={saveButton}
      />
      
      {/* Main Layout - Desktop: 70/30, Tablet/Mobile: Stacked */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Main Content Area */}
        <div className="flex-1 lg:max-w-[70%]">


      {/* Mode Selector */}
      <div className="mb-6">
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'basic' | 'advanced' | 'preview')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advance</TabsTrigger>
            <TabsTrigger value="preview">Preview Playlist</TabsTrigger>
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
              {/* Advance 2-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - 60% (Filter Composer) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Filter Composer */}
                  <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#1F2937]">Filter Composer</h3>
                        <Button
                          onClick={resolveFilters}
                          disabled={!hasUnsavedFilters || isApplyingFilters}
                          size="sm"
                          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                        >
                          {isApplyingFilters ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                      {hasUnsavedFilters && (
                        <p className="text-xs text-[#6B7280] -mt-2">
                          You have unsaved filters. Press Apply to refresh results.
                        </p>
                      )}
                      
                      {filterGroups.map((group) => (
                        <Card key={group.id} className="bg-[#F7F9FC] border border-[#EEF1F6] rounded-lg p-3">
                          <div className="space-y-3">
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
                                  className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                                />
                                <span className="text-sm font-medium text-[#1F2937]">
                                  {group.type === 'include' ? 'Include' : 'Exclude'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFilterGroup(group.id)}
                                className="h-6 w-6 p-0 text-[#6B7280] hover:text-[#1F2937]"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {group.filters.map((filter) => (
                                <div key={filter.id} className="flex items-center space-x-2">
                                  <Select
                                    value={filter.field}
                                    onValueChange={(value) => updateFilter(group.id, filter.id, { field: value })}
                                  >
                                    <SelectTrigger className="w-24 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
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
                                  <div className="flex-1">
                                    {renderFilterField(filter, group.id)}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFilter(group.id, filter.id)}
                                    className="h-6 w-6 p-0 text-[#6B7280] hover:text-[#1F2937]"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addFilter(group.id, 'keywords')}
                                className="w-full h-8 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Filter
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={addFilterGroup}
                        className="w-full h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Filter Group
                      </Button>
                    </div>
                  </Card>

                </div>

                {/* Right Column - 40% (Preview Results) */}
                <div className="lg:col-span-2">
                  <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#1F2937]">Preview Results</h3>
                        <div className="text-xs text-[#6B7280]">
                          Total Items: {previewResults.length} | Duration: {formatDuration(calculatePreviewDuration())}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#6B7280]">
                        <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          Refresh
                        </Button>
                      </div>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handlePreviewDragEnd}
                      >
                        <SortableContext items={previewResults.map(item => item.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-1 max-h-[600px] overflow-y-auto">
                            {previewResults.length === 0 ? (
                              <div className="text-center py-8 text-[#6B7280]">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                <p>No assets match your filters. Adjust filters to see results.</p>
                              </div>
                            ) : (
                              previewResults.map((item, index) => (
                                <PreviewResultItem
                                  key={item.id}
                                  item={item}
                                  index={index}
                                  isPinned={pinnedAssets.includes(item.asset.id)}
                                  onPin={() => handlePinAsset(item.asset.id)}
                                  onRemove={() => handleRemoveFromPreview(item.asset.id)}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              {/* Preview Playlist - Unified combined list */}
              <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1F2937]">Preview Playlist</h3>
                    <div className="text-xs text-[#6B7280]">
                      Total Items: {playlistItems.length + previewResults.length} | Duration: {formatDuration(calculateTotalDuration() + calculatePreviewDuration())}
                    </div>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleUnifiedDragEnd}
                  >
                    <SortableContext items={[...playlistItems, ...previewResults].map(item => item.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1 max-h-[600px] overflow-y-auto">
                        {/* Basic (Manual) Section */}
                        {playlistItems.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 py-2">
                              <div className="h-px bg-[#EEF1F6] flex-1"></div>
                              <span className="text-xs font-medium text-[#6B7280] px-2">Basic (Manual)</span>
                              <div className="h-px bg-[#EEF1F6] flex-1"></div>
                            </div>
                            {playlistItems.map((item, index) => (
                              <UnifiedPlaylistItem
                                key={item.id}
                                item={item}
                                index={index}
                                section="basic"
                                onRemove={handleRemoveAsset}
                                onPin={() => handlePinAsset(item.asset.id)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Advance Section */}
                        {previewResults.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 py-2">
                              <div className="h-px bg-[#EEF1F6] flex-1"></div>
                              <span className="text-xs font-medium text-[#6B7280] px-2">Advance</span>
                              <div className="h-px bg-[#EEF1F6] flex-1"></div>
                            </div>
                            {previewResults.map((item, index) => (
                              <UnifiedPlaylistItem
                                key={item.id}
                                item={item}
                                index={playlistItems.length + index}
                                section="advance"
                                onRemove={() => handleRemoveFromPreview(item.asset.id)}
                                onPin={() => handlePinAsset(item.asset.id)}
                                isPinned={pinnedAssets.includes(item.asset.id)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Empty State */}
                        {playlistItems.length === 0 && previewResults.length === 0 && (
                          <div className="text-center py-8 text-[#6B7280]">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>No items in playlist. Add items from Basic or Advance modes.</p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>



      {/* Preview */}
      {(mode === 'basic' || mode === 'advanced' || mode === 'preview') && (
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

        </div>

        {/* RHS Settings Panel - Desktop */}
        <div className="hidden lg:block lg:w-[30%] lg:max-w-[420px]">
          <RHSSettingsPanel
            playlistName={playlistName}
            setPlaylistName={setPlaylistName}
            playlistDescription={playlistDescription}
            setPlaylistDescription={setPlaylistDescription}
            isActive={isActive}
            setIsActive={setIsActive}
            sortBy={sortBy}
            setSortBy={setSortBy}
            duration={duration}
            setDuration={setDuration}
            refreshFrequency={refreshFrequency}
            setRefreshFrequency={setRefreshFrequency}
            duplicateChecker={duplicateChecker}
            setDuplicateChecker={setDuplicateChecker}
            shortsPlaylist={shortsPlaylist}
            setShortsPlaylist={setShortsPlaylist}
            shufflePlaylist={shufflePlaylist}
            setShufflePlaylist={setShufflePlaylist}
            podcast={podcast}
            setPodcast={setPodcast}
            hlsUrl={hlsUrl}
            setHlsUrl={setHlsUrl}
            mp4Url={mp4Url}
            setMp4Url={setMp4Url}
            recommendation={recommendation}
            setRecommendation={setRecommendation}
            hasUnsavedSettings={hasUnsavedSettings}
            lastSavedTime={lastSavedTime}
            playlistIdDisplay={playlistIdDisplay}
            handleCopyPlaylistId={handleCopyPlaylistId}
          />
        </div>

        {/* RHS Settings Panel - Mobile/Tablet Drawer */}
        {isRhsOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsRhsOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-[#EEF1F6]">
                <h3 className="text-lg font-semibold text-[#1F2937]">Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRhsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-[calc(100vh-80px)] overflow-y-auto">
                <div className="p-4">
                  <RHSSettingsPanel
                    playlistName={playlistName}
                    setPlaylistName={setPlaylistName}
                    playlistDescription={playlistDescription}
                    setPlaylistDescription={setPlaylistDescription}
                    isActive={isActive}
                    setIsActive={setIsActive}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    duration={duration}
                    setDuration={setDuration}
                    refreshFrequency={refreshFrequency}
                    setRefreshFrequency={setRefreshFrequency}
                    duplicateChecker={duplicateChecker}
                    setDuplicateChecker={setDuplicateChecker}
                    shortsPlaylist={shortsPlaylist}
                    setShortsPlaylist={setShortsPlaylist}
                    shufflePlaylist={shufflePlaylist}
                    setShufflePlaylist={setShufflePlaylist}
                    podcast={podcast}
                    setPodcast={setPodcast}
                    hlsUrl={hlsUrl}
                    setHlsUrl={setHlsUrl}
                    mp4Url={mp4Url}
                    setMp4Url={setMp4Url}
                    recommendation={recommendation}
                    setRecommendation={setRecommendation}
                    hasUnsavedSettings={hasUnsavedSettings}
                    lastSavedTime={lastSavedTime}
                    playlistIdDisplay={playlistIdDisplay}
                    handleCopyPlaylistId={handleCopyPlaylistId}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// RHS Settings Panel Component
const RHSSettingsPanel = ({ 
  playlistName, 
  setPlaylistName, 
  playlistDescription, 
  setPlaylistDescription, 
  isActive, 
  setIsActive, 
  sortBy, 
  setSortBy, 
  duration, 
  setDuration, 
  refreshFrequency, 
  setRefreshFrequency, 
  duplicateChecker, 
  setDuplicateChecker, 
  shortsPlaylist, 
  setShortsPlaylist, 
  shufflePlaylist, 
  setShufflePlaylist, 
  podcast, 
  setPodcast, 
  hlsUrl, 
  setHlsUrl, 
  mp4Url, 
  setMp4Url, 
  recommendation, 
  setRecommendation, 
  hasUnsavedSettings, 
  lastSavedTime, 
  playlistIdDisplay, 
  handleCopyPlaylistId 
}: {
  playlistName: string;
  setPlaylistName: (value: string) => void;
  playlistDescription: string;
  setPlaylistDescription: (value: string) => void;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  refreshFrequency: string;
  setRefreshFrequency: (value: string) => void;
  duplicateChecker: string;
  setDuplicateChecker: (value: string) => void;
  shortsPlaylist: boolean;
  setShortsPlaylist: (value: boolean) => void;
  shufflePlaylist: boolean;
  setShufflePlaylist: (value: boolean) => void;
  podcast: boolean;
  setPodcast: (value: boolean) => void;
  hlsUrl: boolean;
  setHlsUrl: (value: boolean) => void;
  mp4Url: string;
  setMp4Url: (value: string) => void;
  recommendation: boolean;
  setRecommendation: (value: boolean) => void;
  hasUnsavedSettings: boolean;
  lastSavedTime: Date | undefined;
  playlistIdDisplay: string;
  handleCopyPlaylistId: () => void;
}) => {
  // Format relative time
  const formatRelativeTime = (date: Date | undefined): string => {
    if (!date) return 'never';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Format absolute time
  const formatAbsoluteTime = (date: Date | undefined): string => {
    if (!date) return 'never';
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-fit sticky top-6">
      {/* Playlist Information - Name and Description */}
      <div className="p-4 border-b border-[#EEF1F6]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="playlist-name" className="text-sm font-semibold text-[#1F2937]">
              Name *
            </Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
            />
          </div>
          <div>
            <Label htmlFor="playlist-description" className="text-sm font-semibold text-[#1F2937]">
              Description
            </Label>
            <Textarea
              id="playlist-description"
              value={playlistDescription}
              onChange={(e) => setPlaylistDescription(e.target.value)}
              placeholder="Enter playlist description"
              className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* RHS Meta Line */}
      <div className="px-4 py-3 border-b border-[#EEF1F6] bg-[#F8F9FA]">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7280]">
            Last saved {formatRelativeTime(lastSavedTime)} · {formatAbsoluteTime(lastSavedTime)}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-[#6B7280]">ID: {playlistIdDisplay}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyPlaylistId}
              className="h-6 w-6 p-0 hover:bg-[#E6E8EF]"
              aria-label="Copy Playlist ID"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* RHS Header */}
      <div className="px-4 py-3 border-b border-[#EEF1F6]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1F2937]">Settings</h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${hasUnsavedSettings ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />
              {hasUnsavedSettings && (
                <Badge variant="outline" className="text-xs text-[#F59E0B] border-[#F59E0B]">
                  Unsaved
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="active-toggle" className="text-sm font-medium text-[#1F2937]">
                {isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-4">
        {/* Row 1: Sort By + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sort-by" className="text-sm font-semibold text-[#1F2937]">
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="recently-updated">Recently Updated</SelectItem>
                <SelectItem value="a-z">A→Z</SelectItem>
                <SelectItem value="z-a">Z→A</SelectItem>
                <SelectItem value="longest">Longest First</SelectItem>
                <SelectItem value="shortest">Shortest First</SelectItem>
                <SelectItem value="live-rec-first">Live Rec First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <Label htmlFor="duration" className="text-sm font-semibold text-[#1F2937]">
                Duration
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-[#6B7280] cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Sets the target total runtime for this playlist. Used by previews and scheduling to balance item count and runtime.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
              <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30m</SelectItem>
                <SelectItem value="45">45m</SelectItem>
                <SelectItem value="60">1h</SelectItem>
                <SelectItem value="90">1.5h</SelectItem>
                <SelectItem value="120">2h</SelectItem>
                <SelectItem value="180">3h</SelectItem>
                <SelectItem value="240">4h</SelectItem>
                <SelectItem value="360">6h</SelectItem>
                <SelectItem value="480">8h</SelectItem>
                <SelectItem value="720">12h</SelectItem>
                <SelectItem value="1440">24h</SelectItem>
                <SelectItem value="2880">48h</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Refresh Frequency + Duplicate Checker */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="refresh-frequency" className="text-sm font-semibold text-[#1F2937]">
              Refresh Frequency
            </Label>
            <Select value={refreshFrequency} onValueChange={setRefreshFrequency}>
              <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="6-hours">6 hours</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="duplicate-checker" className="text-sm font-semibold text-[#1F2937]">
              Duplicate Checker
            </Label>
            <Select value={duplicateChecker} onValueChange={setDuplicateChecker}>
              <SelectTrigger className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                <SelectValue placeholder="Select duplicate policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-duplicates">No Duplicates</SelectItem>
                <SelectItem value="no-back-to-back">No Back-to-Back</SelectItem>
                <SelectItem value="min-repeat-24h">Min Repeat Window: 24h</SelectItem>
                <SelectItem value="min-repeat-7d">Min Repeat Window: 7d</SelectItem>
                <SelectItem value="allow-duplicates">Allow Duplicates</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Shorts Playlist + Shuffle Playlist */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-[#1F2937]">Shorts Playlist</Label>
            <div className="mt-2">
              <Switch
                checked={shortsPlaylist}
                onCheckedChange={setShortsPlaylist}
                className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-[#1F2937]">Shuffle Playlist</Label>
            <div className="mt-2">
              <Switch
                checked={shufflePlaylist}
                onCheckedChange={setShufflePlaylist}
                className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Applies only to the unlocked tail of ordered lists</p>
          </div>
        </div>

        {/* Row 4: Podcast + Delivery */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-[#1F2937]">Podcast</Label>
            <div className="mt-2">
              <Switch
                checked={podcast}
                onCheckedChange={setPodcast}
                className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-[#1F2937]">Delivery</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={hlsUrl}
                  onCheckedChange={setHlsUrl}
                  className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                />
                <Label className="text-sm text-[#1F2937]">HLS URL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={mp4Url} onValueChange={setMp4Url} disabled={!hlsUrl}>
                  <SelectTrigger className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm text-[#1F2937]">MP4 URL</Label>
              </div>
            </div>
          </div>
        </div>
      </div>
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
        <p className="text-sm font-medium truncate">{item.asset.title}</p>
        <p className="text-xs text-muted-foreground">
          {item.asset.duration}m • {item.asset.vendor} • {item.asset.category}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PlaylistCreateEditComplete;
