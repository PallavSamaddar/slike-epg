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
  Plus, 
  X, 
  Search, 
  Save,
  Zap,
  Settings,
  Menu
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { toast } from 'sonner';

// Types
interface PlaylistItem {
  id: string;
  title: string;
  vendor: string;
  type: string;
  duration: number;
  createdAt: string;
  isLive?: boolean;
  section?: 'basic' | 'advance';
}

interface PlaylistCreateEditRHSProps {
  playlistId?: string;
  onNavigate?: (path: string) => void;
}

// Utility function
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
const formatAbsoluteTime = (date: Date): string => {
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

const PlaylistCreateEditRHS: React.FC<PlaylistCreateEditRHSProps> = ({ 
  playlistId, 
  onNavigate 
}) => {
  const isEdit = !!playlistId;
  
  // Basic playlist info
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mode and tabs
  const [mode, setMode] = useState<'basic' | 'advanced' | 'preview'>('basic');
  
  // RHS Settings state
  const [isActive, setIsActive] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [maxContent, setMaxContent] = useState(100);
  const [refreshFrequency, setRefreshFrequency] = useState('manual');
  const [shortsPlaylist, setShortsPlaylist] = useState(false);
  const [shufflePlaylist, setShufflePlaylist] = useState(false);
  const [podcast, setPodcast] = useState(false);
  const [hlsUrl, setHlsUrl] = useState(false);
  const [mp4Url, setMp4Url] = useState('480p');
  const [recommendation, setRecommendation] = useState(false);
  
  // RHS Settings tracking
  const [lastSavedSettings, setLastSavedSettings] = useState({
    isActive: true,
    sortBy: 'newest',
    maxContent: 100,
    refreshFrequency: 'manual',
    shortsPlaylist: false,
    shufflePlaylist: false,
    podcast: false,
    hlsUrl: false,
    mp4Url: '480p',
    recommendation: false
  });
  const [lastSavedTime, setLastSavedTime] = useState(new Date());
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  
  // RHS panel state
  const [isRhsOpen, setIsRhsOpen] = useState(false);
  
  // Track unsaved settings changes
  useEffect(() => {
    const hasChanges = 
      isActive !== lastSavedSettings.isActive ||
      sortBy !== lastSavedSettings.sortBy ||
      maxContent !== lastSavedSettings.maxContent ||
      refreshFrequency !== lastSavedSettings.refreshFrequency ||
      shortsPlaylist !== lastSavedSettings.shortsPlaylist ||
      shufflePlaylist !== lastSavedSettings.shufflePlaylist ||
      podcast !== lastSavedSettings.podcast ||
      hlsUrl !== lastSavedSettings.hlsUrl ||
      mp4Url !== lastSavedSettings.mp4Url ||
      recommendation !== lastSavedSettings.recommendation;
    
    setHasUnsavedSettings(hasChanges);
  }, [
    isActive, sortBy, maxContent, refreshFrequency, shortsPlaylist, 
    shufflePlaylist, podcast, hlsUrl, mp4Url, recommendation, lastSavedSettings
  ]);

  // Update relative time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastSavedTime(new Date(lastSavedTime.getTime()));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [lastSavedTime]);

  // Save playlist handler
  const handleSavePlaylist = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update last saved settings
      setLastSavedSettings({
        isActive,
        sortBy,
        maxContent,
        refreshFrequency,
        shortsPlaylist,
        shufflePlaylist,
        podcast,
        hlsUrl,
        mp4Url,
        recommendation
      });
      
      // Update last saved time
      setLastSavedTime(new Date());
      
      // Reset unsaved states
      setHasUnsavedSettings(false);
      
      toast.success('Playlist saved successfully!');
    } catch (error) {
      toast.error('Failed to save playlist');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRhsOpen) {
        setIsRhsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRhsOpen]);

  // RHS Settings Panel Component
  const RHSSettingsPanel = () => (
    <div className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-fit sticky top-6">
      {/* RHS Header */}
      <div className="p-4 border-b border-[#EEF1F6]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1F2937]">Settings</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${hasUnsavedSettings ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />
            {hasUnsavedSettings && (
              <Badge variant="outline" className="text-xs text-[#F59E0B] border-[#F59E0B]">
                Unsaved
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-[#6B7280]">
          Last saved {formatRelativeTime(lastSavedTime)} · {formatAbsoluteTime(lastSavedTime)}
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8]"
            />
            <span className="text-sm text-[#6B7280]">{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="recently-updated">Recently Updated</SelectItem>
              <SelectItem value="a-z">A→Z</SelectItem>
              <SelectItem value="z-a">Z→A</SelectItem>
              <SelectItem value="longest">Longest First</SelectItem>
              <SelectItem value="shortest">Shortest First</SelectItem>
              <SelectItem value="live-first">Live Rec First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Number of Content */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Max Number of Content</Label>
          <Input
            type="number"
            min="1"
            value={maxContent}
            onChange={(e) => setMaxContent(parseInt(e.target.value) || 1)}
            className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
          />
          <p className="text-xs text-[#6B7280]">Limits resolved items before editorial ordering</p>
        </div>

        {/* Refresh Frequency */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Refresh Frequency</Label>
          <Select value={refreshFrequency} onValueChange={setRefreshFrequency}>
            <SelectTrigger className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
          {refreshFrequency !== 'manual' && (
            <p className="text-xs text-[#6B7280]">
              Next scheduled: {new Date(Date.now() + 3600000).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Shorts Playlist */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Shorts Playlist</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={shortsPlaylist}
              onCheckedChange={setShortsPlaylist}
              disabled={!isActive}
              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] disabled:bg-[#F2F4F8] disabled:border-[#D7DDE8] disabled:shadow-[0_1px_2px_rgba(0,0,0,0.06)] disabled:hover:bg-[#F2F4F8] disabled:focus-visible:outline-[#E3E8F2]"
            />
            <span className="text-sm text-[#6B7280]">{shortsPlaylist ? 'Enabled' : 'Disabled'}</span>
          </div>
          {!isActive && (
            <p className="text-xs text-[#6B7280]">Enable playlist to configure this setting</p>
          )}
        </div>

        {/* Shuffle Playlist */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Shuffle Playlist</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={shufflePlaylist}
              onCheckedChange={setShufflePlaylist}
              disabled={!isActive}
              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] disabled:bg-[#F2F4F8] disabled:border-[#D7DDE8] disabled:shadow-[0_1px_2px_rgba(0,0,0,0.06)] disabled:hover:bg-[#F2F4F8] disabled:focus-visible:outline-[#E3E8F2]"
            />
            <span className="text-sm text-[#6B7280]">{shufflePlaylist ? 'Enabled' : 'Disabled'}</span>
          </div>
          <p className="text-xs text-[#6B7280]">Applies only to the unlocked tail in ordered lists</p>
        </div>

        {/* Podcast */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Podcast</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={podcast}
              onCheckedChange={setPodcast}
              disabled={!isActive}
              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8] disabled:bg-[#F2F4F8] disabled:border-[#D7DDE8] disabled:shadow-[0_1px_2px_rgba(0,0,0,0.06)] disabled:hover:bg-[#F2F4F8] disabled:focus-visible:outline-[#E3E8F2]"
            />
            <span className="text-sm text-[#6B7280]">{podcast ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-[#1F2937]">Delivery</Label>
          
          {/* HLS URL */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={hlsUrl}
              onCheckedChange={setHlsUrl}
              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8]"
            />
            <span className="text-sm text-[#6B7280]">HLS URL</span>
          </div>
          
          {/* MP4 URL */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={mp4Url !== 'disabled'}
                onCheckedChange={(checked) => setMp4Url(checked ? '480p' : 'disabled')}
                className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8]"
              />
              <span className="text-sm text-[#6B7280]">MP4 URL</span>
            </div>
            {mp4Url !== 'disabled' && (
              <Select value={mp4Url} onValueChange={setMp4Url}>
                <SelectTrigger className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-[#1F2937]">Recommendation</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={recommendation}
              onCheckedChange={setRecommendation}
              className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8]"
            />
            <span className="text-sm text-[#6B7280]">{recommendation ? 'Enabled' : 'Disabled'}</span>
          </div>
          <p className="text-xs text-[#6B7280]">Future hook</p>
        </div>
      </div>
    </div>
  );

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
        disabled={loading}
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
        title={isEdit ? 'Edit Playlist' : 'Create Playlist'}
        showBackToPlaylists={true}
        onBackToPlaylists={() => onNavigate?.('playlists')}
        rightContent={saveButton}
      />
      
      {/* Main Layout - Desktop: 70/30, Tablet/Mobile: Stacked */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Main Content Area */}
        <div className="flex-1 lg:max-w-[70%]">

          {/* Basic Info */}
          <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-6">
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
                  className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Enter playlist description"
                  className="bg-white border-[#E6E8EF] text-[#1F2937] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mode Selector */}
          <Card className="bg-white border border-[#E6E8EF] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-6">
            <CardHeader>
              <CardTitle>Playlist Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={(value) => setMode(value as 'basic' | 'advanced' | 'preview')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advance</TabsTrigger>
                  <TabsTrigger value="preview">Preview Playlist</TabsTrigger>
                </TabsList>

                {/* Basic Mode */}
                <TabsContent value="basic" className="mt-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Basic (Manual) Mode</h3>
                    <p className="text-[#6B7280] mb-6">Manually add and arrange playlist items</p>
                    <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Items
                    </Button>
                  </div>
                </TabsContent>

                {/* Advanced Mode */}
                <TabsContent value="advanced" className="mt-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Advance (Rule-based) Mode</h3>
                    <p className="text-[#6B7280] mb-6">Create rules to automatically populate your playlist</p>
                    <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                      <Zap className="w-4 h-4 mr-2" />
                      Configure Rules
                    </Button>
                  </div>
                </TabsContent>

                {/* Preview Playlist Mode */}
                <TabsContent value="preview" className="mt-6">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Preview Playlist</h3>
                    <p className="text-[#6B7280] mb-6">Preview and finalize your playlist before saving</p>
                    <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                      <Search className="w-4 h-4 mr-2" />
                      Preview Playlist
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RHS Settings Panel - Desktop */}
        <div className="hidden lg:block lg:w-[30%] lg:max-w-[420px]">
          <RHSSettingsPanel />
        </div>
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
              <div className="p-4 space-y-4">
                {/* Same settings content as desktop */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#1F2937]">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      className="data-[state=checked]:bg-[#3B82F6] data-[state=unchecked]:bg-[#F2F4F8] data-[state=unchecked]:border-[#D7DDE8]"
                    />
                    <span className="text-sm text-[#6B7280]">{isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                {/* Add other settings here - same as desktop version */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistCreateEditRHS;
