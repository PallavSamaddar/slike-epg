import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, Filter, MoreVertical, X, Settings, Star, Copy, Trash, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';

interface Playlist {
  id: string;
  title: string;
  duration: number | null; // null for dynamic playlists
  videoCount: number | null; // null for dynamic playlists
  type: 'Basic' | 'Advanced';
  programBindings: number;
  status: 'enabled' | 'disabled' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface SavedView {
  id: string;
  name: string;
  slug: string;
  filters: {
    type: string;
    status: string;
    duration: string;
  };
  sort: {
    column: string;
    direction: 'asc' | 'desc';
  };
  pageSize: number;
  visibleColumns: string[];
  isDefault: boolean;
  lastUsed: string;
  createdAt: string;
}

interface FilterState {
  type: string;
  status: string;
  duration: string;
}

interface QuickCounts {
  enabled: number;
  disabled: number;
  draft: number;
  basic: number;
  advanced: number;
}

interface Props {
  onNavigate?: (view: string) => void;
}

const PlaylistManagement = ({ onNavigate }: Props) => {
  const { toast } = useToast();
  
  console.log('PlaylistManagement component loaded');
  
  // Core state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
    duration: 'all'
  });
  
  // Active filter chips
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Quick counts
  const [quickCounts, setQuickCounts] = useState<QuickCounts>({
    enabled: 0,
    disabled: 0,
    draft: 0,
    basic: 0,
    advanced: 0
  });
  
  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [recentlyUsedViews, setRecentlyUsedViews] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<SavedView | null>(null);
  const [isViewModified, setIsViewModified] = useState(false);
  const [savedViewDialogOpen, setSavedViewDialogOpen] = useState(false);
  const [savedViewName, setSavedViewName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [savedViewAction, setSavedViewAction] = useState<'save' | 'update' | 'saveAs' | null>(null);
  
  // Column chooser
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'title', 'playlistId', 'duration', 'videoCount', 'type', 'programBindings', 'status', 'actions'
  ]);
  const [columnChooserOpen, setColumnChooserOpen] = useState(false);
  
  // Bulk actions
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable' | 'delete' | null>(null);
  
  // Sort and pagination
  const [sortColumn, setSortColumn] = useState('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  const itemsPerPage = pageSize;

  // Mock data
  const mockPlaylists: Playlist[] = [
    {
      id: '1xvtqat9zg',
      title: 'Sports Highlights',
      duration: 180, // 3 hours
      videoCount: 45,
      type: 'Basic',
      programBindings: 12,
      status: 'enabled',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '1x8k2m7n4p',
      title: 'Music Mix',
      duration: 240, // 4 hours
      videoCount: 60,
      type: 'Basic',
      programBindings: 8,
      status: 'enabled',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z'
    },
    {
      id: '1x5q9w3e1r',
      title: 'Tech Reviews',
      duration: 120, // 2 hours
      videoCount: 30,
      type: 'Advanced',
      programBindings: 5,
      status: 'disabled',
      createdAt: '2024-01-05T11:00:00Z',
      updatedAt: '2024-01-15T12:20:00Z'
    },
    {
      id: '1x2a6s8d4f',
      title: 'News Roundup',
      duration: null, // Dynamic playlist
      videoCount: null, // Dynamic playlist
      type: 'Advanced',
      programBindings: 15,
      status: 'enabled',
      createdAt: '2024-01-01T08:00:00Z',
      updatedAt: '2024-01-22T10:15:00Z'
    },
    {
      id: '1x7g3h9j5k',
      title: 'Entertainment Mix',
      duration: 300, // 5 hours
      videoCount: 75,
      type: 'Basic',
      programBindings: 3,
      status: 'enabled',
      createdAt: '2024-01-12T13:00:00Z',
      updatedAt: '2024-01-19T09:30:00Z'
    },
    {
      id: '1x4l8z1x6c',
      title: 'Draft Playlist',
      duration: 90, // 1.5 hours
      videoCount: 20,
      type: 'Basic',
      programBindings: 0,
      status: 'draft',
      createdAt: '2024-01-25T14:00:00Z',
      updatedAt: '2024-01-25T14:00:00Z'
    },
    {
      id: '1x9v2b7n3m',
      title: 'Short Clips',
      duration: 30, // 30 minutes
      videoCount: 15,
      type: 'Advanced',
      programBindings: 2,
      status: 'enabled',
      createdAt: '2024-01-20T11:00:00Z',
      updatedAt: '2024-01-23T09:15:00Z'
    },
    {
      id: '1x6y5u8i0o',
      title: 'Long Form Content',
      duration: 480, // 8 hours
      videoCount: 12,
      type: 'Basic',
      programBindings: 6,
      status: 'disabled',
      createdAt: '2024-01-18T16:00:00Z',
      updatedAt: '2024-01-24T13:45:00Z'
    }
  ];

  // Utility functions
  const generateSlug = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const formatDuration = (minutes: number | null): string => {
    if (minutes === null) return 'Dynamic';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDurationCategory = (minutes: number | null): string => {
    if (minutes === null) return 'dynamic';
    if (minutes <= 60) return 'short';
    if (minutes <= 180) return '1-3h';
    if (minutes <= 360) return '3-6h';
    if (minutes <= 720) return '6-12h';
    if (minutes <= 1440) return '12-24h';
    if (minutes <= 2880) return '24-48h';
    return '48h+';
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Screen reader announcements
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // URL management
  const updateURL = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, '', url.toString());
  }, []);

  const parseURLParams = useCallback(() => {
    const url = new URL(window.location.href);
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const duration = url.searchParams.get('duration') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const view = url.searchParams.get('view');
    const cols = url.searchParams.get('cols');
    
    return { type, status, duration, page, view, cols };
  }, []);

  // Filter and search functions
  const filterPlaylists = useCallback((playlists: Playlist[], filters: FilterState, search: string) => {
    return playlists.filter(playlist => {
      // Search filter
      if (search && !playlist.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && playlist.type.toLowerCase() !== filters.type.toLowerCase()) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && playlist.status !== filters.status) {
        return false;
      }
      
      // Duration filter
      if (filters.duration !== 'all') {
        const durationCategory = getDurationCategory(playlist.duration);
        if (durationCategory !== filters.duration) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  const calculateQuickCounts = useCallback((playlists: Playlist[]) => {
    const counts = {
      enabled: 0,
      disabled: 0,
      draft: 0,
      basic: 0,
      advanced: 0
    };
    
    playlists.forEach(playlist => {
      if (playlist.status === 'enabled') counts.enabled++;
      if (playlist.status === 'disabled') counts.disabled++;
      if (playlist.status === 'draft') counts.draft++;
      if (playlist.type === 'Basic') counts.basic++;
      if (playlist.type === 'Advanced') counts.advanced++;
    });
    
    return counts;
  }, []);

  const updateActiveFilters = useCallback((filters: FilterState) => {
    const active: string[] = [];
    if (filters.type !== 'all') active.push(`Type: ${filters.type}`);
    if (filters.status !== 'all') active.push(`Status: ${filters.status}`);
    if (filters.duration !== 'all') active.push(`Duration: ${filters.duration}`);
    setActiveFilters(active);
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [currentPage, searchQuery, filters, sortColumn, sortDirection, pageSize]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filtered = filterPlaylists(mockPlaylists, filters, searchQuery);
      
      // Sort playlists
      const sorted = [...filtered].sort((a, b) => {
        let aValue: any = a[sortColumn as keyof Playlist];
        let bValue: any = b[sortColumn as keyof Playlist];
        
        if (sortColumn === 'duration' || sortColumn === 'videoCount' || sortColumn === 'programBindings') {
          aValue = aValue || 0;
          bValue = bValue || 0;
        } else if (sortColumn === 'createdAt' || sortColumn === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginated = sorted.slice(startIndex, endIndex);
      
      setPlaylists(paginated);
      setTotalPages(Math.ceil(sorted.length / itemsPerPage));
      setTotalCount(sorted.length);
      setQuickCounts(calculateQuickCounts(filtered));
      updateActiveFilters(filters);
      setIsLoading(false);
    }, 300);
  };

  const handleStatusToggle = async (playlistId: string) => {
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, status: playlist.status === 'enabled' ? 'disabled' : 'enabled' }
        : playlist
    ));
    
    toast({
      title: 'Status updated',
      description: 'Playlist status has been updated successfully.',
    });
  };

  const handleDelete = async (playlistId: string) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
    setDeleteDialogOpen(false);
    setPlaylistToDelete(null);
    
    toast({
      title: 'Playlist deleted',
      description: 'The playlist has been deleted successfully.',
    });
  };

  const formatVideoCount = (count: number | null) => {
    if (count === null) return '~';
    return count.toString();
  };

  // New handler functions
  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL({ ...newFilters, page: '1' });
  };

  const handleClearFilters = () => {
    const clearedFilters = { type: 'all', status: 'all', duration: 'all' };
    setFilters(clearedFilters);
    setCurrentPage(1);
    updateURL({ ...clearedFilters, page: '1' });
  };

  const handleQuickCountClick = (type: 'status' | 'type', value: string) => {
    if (type === 'status') {
      const newStatus = filters.status === value ? 'all' : value;
      handleFilterChange('status', newStatus);
      
      // Announce filter change for screen readers
      const announcement = newStatus === 'all' 
        ? `Filter Status: ${value} cleared` 
        : `Filter Status: ${value} applied`;
      announceToScreenReader(announcement);
    } else {
      const newType = filters.type === value ? 'all' : value;
      handleFilterChange('type', newType);
      
      // Announce filter change for screen readers
      const announcement = newType === 'all' 
        ? `Filter Type: ${value} cleared` 
        : `Filter Type: ${value} applied`;
      announceToScreenReader(announcement);
    }
  };

  const handleActiveFilterRemove = (filterText: string) => {
    const filterType = filterText.split(':')[0].toLowerCase();
    const filterValue = filterText.split(':')[1].trim();
    
    if (filterType === 'type') {
      handleFilterChange('type', 'all');
    } else if (filterType === 'status') {
      handleFilterChange('status', 'all');
    } else if (filterType === 'duration') {
      handleFilterChange('duration', 'all');
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleColumnToggle = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const handleCopyPlaylistId = async (playlistId: string) => {
    try {
      await navigator.clipboard.writeText(playlistId);
      toast({
        title: 'Copied to clipboard',
        description: `Playlist ID "${playlistId}" copied successfully`,
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy Playlist ID to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlaylists(playlists.map(p => p.id));
    } else {
      setSelectedPlaylists([]);
    }
  };

  const handleSelectPlaylist = (playlistId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlaylists(prev => [...prev, playlistId]);
    } else {
      setSelectedPlaylists(prev => prev.filter(id => id !== playlistId));
    }
  };

  const handleBulkAction = (action: 'enable' | 'disable' | 'delete') => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction) return;
    
    const selectedPlaylistObjects = playlists.filter(p => selectedPlaylists.includes(p.id));
    
    if (bulkAction === 'delete') {
      setPlaylists(prev => prev.filter(p => !selectedPlaylists.includes(p.id)));
    } else {
      const newStatus = bulkAction === 'enable' ? 'enabled' : 'disabled';
      setPlaylists(prev => prev.map(p => 
        selectedPlaylists.includes(p.id) ? { ...p, status: newStatus } : p
      ));
    }
    
    setSelectedPlaylists([]);
    setBulkActionDialogOpen(false);
    setBulkAction(null);
    
    toast({
      title: `Bulk ${bulkAction} completed`,
      description: `${selectedPlaylistObjects.length} playlists have been ${bulkAction}d.`,
    });
  };


  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, mockPlaylists.length);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {totalCount} playlists found
      </div>
      
      <PageHeader 
        title="Playlist Management" 
        rightContent={
          <Button 
            variant="default"
            onClick={() => onNavigate?.('playlist-create')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm pt-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        }
      />
      
      {/* Toolbar Row */}
      <Card className="mb-4 bg-white border-[#E6E8EF] rounded-xl">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            {/* Left segment - Search + Filters + Clear */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Search is already applied on change, but we can add any additional logic here
                    }
                    if (e.key === 'Escape') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="pl-10 w-full sm:w-64 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                  aria-label="Search playlists"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-[#6B7280]">Type</Label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2" aria-label="Filter by Type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="advanced">Advance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-[#6B7280]">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2" aria-label="Filter by Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium text-[#6B7280]">Duration</Label>
                  <Select value={filters.duration} onValueChange={(value) => handleFilterChange('duration', value)}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2" aria-label="Filter by Duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      <SelectItem value="short">Short ≤1h</SelectItem>
                      <SelectItem value="1-3h">1–3h</SelectItem>
                      <SelectItem value="3-6h">3–6h</SelectItem>
                      <SelectItem value="6-12h">6–12h</SelectItem>
                      <SelectItem value="12-24h">12–24h</SelectItem>
                      <SelectItem value="24-48h">24–48h</SelectItem>
                      <SelectItem value="48h+">48h+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleClearFilters}
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs bg-[#F2F4F8] border-[#9CA3AF] text-[#374151] hover:bg-[#6B7280] hover:text-white hover:border-[#6B7280] transition-colors"
                  aria-label="Clear all filters"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Right segment - Columns */}
            <div className="flex items-center gap-2 justify-end sm:justify-start">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setColumnChooserOpen(true)}
                className="h-8 text-xs bg-[#F2F4F8] border-[#9CA3AF] text-[#374151] hover:bg-[#6B7280] hover:text-white hover:border-[#6B7280] transition-colors"
              >
                <Settings className="h-3 w-3 mr-1" />
                Columns ▾
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Counts */}
      <div className="flex flex-wrap items-center gap-6 mb-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#6B7280]">Status:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickCountClick('status', 'enabled')}
              aria-pressed={filters.status === 'enabled'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                filters.status === 'enabled'
                  ? 'bg-slate-600 border-slate-600 text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue'
                  : 'bg-transparent border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
              }`}
            >
              Enabled ({quickCounts.enabled})
            </button>
            <button
              onClick={() => handleQuickCountClick('status', 'disabled')}
              aria-pressed={filters.status === 'disabled'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                filters.status === 'disabled'
                  ? 'bg-slate-600 border-slate-600 text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue'
                  : 'bg-transparent border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
              }`}
            >
              Disabled ({quickCounts.disabled})
            </button>
            <button
              onClick={() => handleQuickCountClick('status', 'draft')}
              aria-pressed={filters.status === 'draft'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                filters.status === 'draft'
                  ? 'bg-slate-600 border-slate-600 text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue'
                  : 'bg-transparent border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
              }`}
            >
              Draft ({quickCounts.draft})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#6B7280]">Type:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickCountClick('type', 'basic')}
              aria-pressed={filters.type === 'basic'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                filters.type === 'basic'
                  ? 'bg-slate-600 border-slate-600 text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue'
                  : 'bg-transparent border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
              }`}
            >
              Basic ({quickCounts.basic})
            </button>
            <button
              onClick={() => handleQuickCountClick('type', 'advanced')}
              aria-pressed={filters.type === 'advanced'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                filters.type === 'advanced'
                  ? 'bg-slate-600 border-slate-600 text-white hover:bg-broadcast-blue hover:text-white hover:border-broadcast-blue'
                  : 'bg-transparent border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
              }`}
            >
              Advanced ({quickCounts.advanced})
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-[#6B7280]">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 text-xs"
            >
              {filter}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActiveFilterRemove(filter)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedPlaylists.length > 0 && (
        <Card className="mb-4 bg-[#F0F9FF] border-[#3B82F6]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#1F2937]">
                {selectedPlaylists.length} playlist{selectedPlaylists.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('enable')}
                  className="h-8 text-xs"
                >
                  Enable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('disable')}
                  className="h-8 text-xs"
                >
                  Disable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="h-8 text-xs bg-[#DC2626] text-white border-[#B91C1C] hover:bg-[#B91C1C] focus-visible:ring-2 focus-visible:ring-[#EF4444] font-semibold"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-card-dark border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground w-12">
                    <Checkbox
                      checked={selectedPlaylists.length === playlists.length && playlists.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#9CA3AF] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    />
                  </th>
                  {visibleColumns.includes('title') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('title')}
                    >
                      Title {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('playlistId') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('playlistId')}
                    >
                      Playlist ID {sortColumn === 'playlistId' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('duration') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('duration')}
                    >
                      Duration {sortColumn === 'duration' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('videoCount') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('videoCount')}
                    >
                      Videos {sortColumn === 'videoCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('type') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('type')}
                    >
                      Type {sortColumn === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('programBindings') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('programBindings')}
                    >
                      Added to Programs {sortColumn === 'programBindings' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('status') && (
                    <th 
                      className="text-left p-4 font-medium text-foreground cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {visibleColumns.includes('actions') && (
                    <th className="text-left p-4 font-medium text-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-muted-foreground">
                      Loading playlists...
                    </td>
                  </tr>
                ) : playlists.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-muted-foreground">
                      No playlists found
                    </td>
                  </tr>
                ) : (
                  playlists.map((playlist) => (
                    <tr key={playlist.id} className="border-b border-border hover:bg-control-surface/50">
                      <td className="p-4 w-12">
                        <Checkbox
                          checked={selectedPlaylists.includes(playlist.id)}
                          onCheckedChange={(checked) => handleSelectPlaylist(playlist.id, checked as boolean)}
                          className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#9CA3AF] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                        />
                      </td>
                      {visibleColumns.includes('title') && (
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-foreground">{playlist.title}</div>
                            <div className="text-sm text-muted-foreground">
                              Created {new Date(playlist.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('playlistId') && (
                        <td className="p-4 text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{playlist.id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPlaylistId(playlist.id)}
                              className="h-6 w-6 p-0 bg-[#F2F4F8] border-[#9CA3AF] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#374151] hover:border-[#9CA3AF] transition-colors"
                              aria-label={`Copy playlist ID ${playlist.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('duration') && (
                        <td className="p-4 text-foreground">
                          {formatDuration(playlist.duration)}
                        </td>
                      )}
                      {visibleColumns.includes('videoCount') && (
                        <td className="p-4 text-foreground">
                          {formatVideoCount(playlist.videoCount)}
                        </td>
                      )}
                      {visibleColumns.includes('type') && (
                        <td className="p-4">
                          <Badge 
                            variant={playlist.type === 'Advanced' ? 'default' : 'secondary'}
                            className={playlist.type === 'Advanced' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {playlist.type}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.includes('programBindings') && (
                        <td className="p-4 text-foreground">
                          {playlist.programBindings}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={playlist.status === 'enabled'}
                              onCheckedChange={() => handleStatusToggle(playlist.id)}
                              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#9CA3AF] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                            />
                            <Badge 
                              variant="secondary"
                              className={
                                playlist.status === 'enabled' 
                                  ? 'bg-green-100 text-green-800' 
                                  : playlist.status === 'disabled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {playlist.status}
                            </Badge>
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onNavigate?.(`playlists/${playlist.id}/edit`)}
                              className="h-8 px-3 bg-[#F2F4F8] border-[#9CA3AF] text-[#374151] hover:bg-[#6B7280] hover:text-white hover:border-[#6B7280] transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setPlaylistToDelete(playlist);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex}–{Math.min(endIndex, totalCount)} of {totalCount} playlists
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Column Chooser Dialog */}
      <Dialog open={columnChooserOpen} onOpenChange={setColumnChooserOpen}>
        <DialogContent className="bg-white border-[#E6E8EF]">
          <DialogHeader>
            <DialogTitle>Choose Columns</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {[
              { key: 'title', label: 'Title' },
              { key: 'playlistId', label: 'Playlist ID' },
              { key: 'duration', label: 'Duration' },
              { key: 'videoCount', label: 'Videos' },
              { key: 'type', label: 'Type' },
              { key: 'programBindings', label: 'Added to Programs' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: 'Actions' }
            ].map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={column.key}
                  checked={visibleColumns.includes(column.key)}
                  onCheckedChange={() => handleColumnToggle(column.key)}
                  className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                />
                <Label htmlFor={column.key} className="text-sm font-medium">
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setColumnChooserOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent className="bg-white border-[#E6E8EF]">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'delete' ? 'Delete Playlists' : 
               bulkAction === 'enable' ? 'Enable Playlists' : 'Disable Playlists'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#1F2937]">
              Are you sure you want to {bulkAction} {selectedPlaylists.length} playlist{selectedPlaylists.length !== 1 ? 's' : ''}?
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={executeBulkAction}
            >
              {bulkAction === 'delete' ? 'Delete' : 
               bulkAction === 'enable' ? 'Enable' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved View Dialog */}
      <Dialog open={savedViewDialogOpen} onOpenChange={setSavedViewDialogOpen}>
        <DialogContent className="bg-white border-[#E6E8EF]">
          <DialogHeader>
            <DialogTitle>
              {savedViewAction === 'save' ? 'Save Current View' :
               savedViewAction === 'update' ? 'Update View' : 'Save as New View'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="view-name" className="text-sm font-medium text-[#1F2937]">
                View Name
              </Label>
              <Input
                id="view-name"
                value={savedViewName}
                onChange={(e) => setSavedViewName(e.target.value)}
                placeholder="Enter view name"
                className="mt-1 bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="make-default"
                checked={makeDefault}
                onCheckedChange={setMakeDefault}
                className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] data-[state=unchecked]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
              <Label htmlFor="make-default" className="text-sm font-medium text-[#1F2937]">
                Make this the default view
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavedViewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // TODO: Implement save view logic
                setSavedViewDialogOpen(false);
                toast({
                  title: 'View saved',
                  description: 'Your view has been saved successfully.',
                });
              }}
              disabled={!savedViewName.trim()}
            >
              {savedViewAction === 'save' ? 'Save' :
               savedViewAction === 'update' ? 'Update' : 'Save as New'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card-dark border-border">
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              Are you sure you want to delete "{playlistToDelete?.title}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => playlistToDelete && handleDelete(playlistToDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistManagement;
