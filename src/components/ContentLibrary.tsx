import { useState } from 'react';
import { Upload, Search, Filter, Play, Clock, Tag, FileVideo, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface VideoAsset {
  id: string;
  title: string;
  duration: string;
  format: string;
  size: string;
  uploadDate: string;
  tags: string[];
  genre: string;
  language: string;
  geoAvailability: string[];
  thumbnail: string;
  status: 'ready' | 'processing' | 'error';
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  totalDuration: string;
  itemCount: number;
  lastModified: string;
  tags: string[];
}

export const ContentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [activeTab, setActiveTab] = useState<'assets' | 'playlists'>('assets');

  const mockAssets: VideoAsset[] = [
    {
      id: '1',
      title: 'Breaking News Intro',
      duration: '00:30',
      format: 'MP4',
      size: '45 MB',
      uploadDate: '2024-01-15',
      tags: ['intro', 'news', 'breaking'],
      genre: 'News',
      language: 'English',
      geoAvailability: ['Global'],
      thumbnail: 'https://via.placeholder.com/160x90?text=News+Intro',
      status: 'ready'
    },
    {
      id: '2',
      title: 'Movie: Classic Adventure',
      duration: '02:15:30',
      format: 'MP4',
      size: '3.2 GB',
      uploadDate: '2024-01-14',
      tags: ['movie', 'adventure', 'classic'],
      genre: 'Movies',
      language: 'English',
      geoAvailability: ['US', 'EU'],
      thumbnail: 'https://via.placeholder.com/160x90?text=Adventure+Movie',
      status: 'ready'
    },
    {
      id: '3',
      title: 'Tech Documentary Series Ep1',
      duration: '00:45:00',
      format: 'MP4',
      size: '890 MB',
      uploadDate: '2024-01-13',
      tags: ['documentary', 'tech', 'series'],
      genre: 'Documentary',
      language: 'English',
      geoAvailability: ['Global'],
      thumbnail: 'https://via.placeholder.com/160x90?text=Tech+Doc',
      status: 'processing'
    }
  ];

  const mockPlaylists: Playlist[] = [
    {
      id: '1',
      name: 'Morning News Block',
      description: 'Complete morning news programming including intros, segments, and weather',
      totalDuration: '01:30:00',
      itemCount: 8,
      lastModified: '2024-01-15',
      tags: ['news', 'morning', 'live']
    },
    {
      id: '2',
      name: 'Classic Movies Collection',
      description: 'Curated selection of classic films for weekend programming',
      totalDuration: '08:45:30',
      itemCount: 4,
      lastModified: '2024-01-14',
      tags: ['movies', 'classic', 'weekend']
    },
    {
      id: '3',
      name: 'Prime Time Entertainment',
      description: 'Evening entertainment programming mix',
      totalDuration: '03:20:15',
      itemCount: 12,
      lastModified: '2024-01-13',
      tags: ['entertainment', 'primetime', 'variety']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-status-online text-white';
      case 'processing': return 'bg-status-scheduled text-black';
      case 'error': return 'bg-status-offline text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const UploadDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="broadcast">
          <Upload className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card-dark border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Video Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-broadcast-blue/30 rounded-lg p-8 text-center hover:border-broadcast-blue/50 transition-colors">
            <Upload className="h-12 w-12 mx-auto mb-4 text-broadcast-blue" />
            <p className="text-foreground font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-muted-foreground">Supports MP4, MOV, AVI up to 10GB</p>
            <Button variant="outline" className="mt-4">Browse Files</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset-title">Title</Label>
              <Input 
                id="asset-title" 
                placeholder="Video title"
                className="bg-control-surface border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="asset-genre">Genre</Label>
              <Select>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="movies">Movies</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset-language">Language</Label>
              <Select>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="asset-geo">Geographic Availability</Label>
              <Select>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue placeholder="Select regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="us-eu">US/EU</SelectItem>
                  <SelectItem value="americas">Americas</SelectItem>
                  <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="asset-tags">Tags</Label>
            <Input 
              id="asset-tags" 
              placeholder="news, breaking, live (comma separated)"
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="asset-description">Description</Label>
            <Textarea 
              id="asset-description" 
              placeholder="Asset description and notes..."
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="broadcast" className="flex-1">
              Upload & Process
            </Button>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const CreatePlaylistDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="playlist">
          <Plus className="h-4 w-4 mr-2" />
          Create Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card-dark border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input 
              id="playlist-name" 
              placeholder="Enter playlist name"
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="playlist-description">Description</Label>
            <Textarea 
              id="playlist-description" 
              placeholder="Playlist description and usage notes..."
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="playlist-tags">Tags</Label>
            <Input 
              id="playlist-tags" 
              placeholder="news, morning, live (comma separated)"
              className="bg-control-surface border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="playlist" className="flex-1">
              Create Playlist
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
          <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
          <p className="text-muted-foreground">Manage video assets and playlists</p>
        </div>
        <div className="flex items-center gap-4">
          <UploadDialog />
          <CreatePlaylistDialog />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6">
        <Button 
          variant={activeTab === 'assets' ? 'broadcast' : 'ghost'}
          onClick={() => setActiveTab('assets')}
          className="rounded-r-none"
        >
          <FileVideo className="h-4 w-4 mr-2" />
          Video Assets
        </Button>
        <Button 
          variant={activeTab === 'playlists' ? 'broadcast' : 'ghost'}
          onClick={() => setActiveTab('playlists')}
          className="rounded-l-none"
        >
          <Play className="h-4 w-4 mr-2" />
          Playlists
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card-dark border-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-control-surface border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32 bg-control-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="movies">Movies</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32 bg-control-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {activeTab === 'assets' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockAssets.map((asset) => (
            <Card key={asset.id} className="bg-card-dark border-border hover:border-broadcast-blue transition-colors">
              <CardContent className="p-4">
                <div className="aspect-video bg-control-surface rounded mb-3 flex items-center justify-center">
                  <FileVideo className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-foreground text-sm line-clamp-2">{asset.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card-dark border-border">
                        <DropdownMenuItem className="text-foreground hover:bg-control-surface">Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-control-surface">Download</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-control-surface">Add to Playlist</DropdownMenuItem>
                        <DropdownMenuItem className="text-status-offline hover:bg-control-surface">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {asset.duration}
                    <span>•</span>
                    {asset.size}
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {asset.format}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {asset.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPlaylists.map((playlist) => (
            <Card key={playlist.id} className="bg-card-dark border-border hover:border-mcr-playlist transition-colors">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-foreground">{playlist.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card-dark border-border">
                      <DropdownMenuItem className="text-foreground hover:bg-control-surface">Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground hover:bg-control-surface">Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-foreground hover:bg-control-surface">Export</DropdownMenuItem>
                      <DropdownMenuItem className="text-status-offline hover:bg-control-surface">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {playlist.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground font-mono">{playlist.totalDuration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="text-foreground">{playlist.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="text-foreground">{playlist.lastModified}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-4">
                  {playlist.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-mcr-playlist/20 text-mcr-playlist rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                <Button variant="playlist" size="sm" className="w-full mt-4">
                  <Play className="h-4 w-4 mr-2" />
                  Edit Playlist
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};