import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';

interface Playlist {
  id: string;
  title: string;
  duration: number | null; // null for dynamic playlists
  videoCount: number | null; // null for dynamic playlists
  type: 'Basic' | 'Advanced';
  programBindings: number;
  status: 'enabled' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onNavigate?: (view: string) => void;
}

const PlaylistManagement = ({ onNavigate }: Props) => {
  const { toast } = useToast();
  
  console.log('PlaylistManagement component loaded');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  // Mock data
  const mockPlaylists: Playlist[] = [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
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
      id: '4',
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
      id: '5',
      title: 'Entertainment Mix',
      duration: 300, // 5 hours
      videoCount: 75,
      type: 'Basic',
      programBindings: 3,
      status: 'enabled',
      createdAt: '2024-01-12T13:00:00Z',
      updatedAt: '2024-01-19T09:30:00Z'
    }
  ];

  useEffect(() => {
    loadPlaylists();
  }, [currentPage, searchQuery]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      let filteredPlaylists = mockPlaylists;
      
      if (searchQuery) {
        filteredPlaylists = mockPlaylists.filter(playlist =>
          playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedPlaylists = filteredPlaylists.slice(startIndex, endIndex);
      
      setPlaylists(paginatedPlaylists);
      setTotalPages(Math.ceil(filteredPlaylists.length / itemsPerPage));
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

  const formatDuration = (duration: number | null) => {
    if (duration === null) return '—';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatVideoCount = (count: number | null) => {
    if (count === null) return '~';
    return count.toString();
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, mockPlaylists.length);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <PageHeader title="Playlist Management" />
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-control-surface border-border text-foreground"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button 
          variant="broadcast" 
          onClick={() => onNavigate?.('playlist-create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Playlist
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-card-dark border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Title</th>
                  <th className="text-left p-4 font-medium text-foreground">Duration</th>
                  <th className="text-left p-4 font-medium text-foreground">Videos</th>
                  <th className="text-left p-4 font-medium text-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-foreground">Added to Programs</th>
                  <th className="text-left p-4 font-medium text-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading playlists...
                    </td>
                  </tr>
                ) : playlists.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No playlists found
                    </td>
                  </tr>
                ) : (
                  playlists.map((playlist) => (
                    <tr key={playlist.id} className="border-b border-border hover:bg-control-surface/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground">{playlist.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Created {new Date(playlist.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">
                        {formatDuration(playlist.duration)}
                      </td>
                      <td className="p-4 text-foreground">
                        {formatVideoCount(playlist.videoCount)}
                      </td>
                      <td className="p-4">
                        <Badge variant={playlist.type === 'Basic' ? 'default' : 'secondary'}>
                          {playlist.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-foreground">
                        {playlist.programBindings}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={playlist.status === 'enabled'}
                            onCheckedChange={() => handleStatusToggle(playlist.id)}
                          />
                          <span className={`text-sm ${
                            playlist.status === 'enabled' ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            {playlist.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onNavigate?.(`playlists/${playlist.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
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
                      </td>
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
            Showing {startIndex}–{endIndex} of {mockPlaylists.length} playlists
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
