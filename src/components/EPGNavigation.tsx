import { useState } from 'react';
import { Monitor, Calendar, Video, Radio, Settings, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const EPGNavigation = ({ activeView, onViewChange }: NavigationProps) => {
  const [liveCount] = useState(2);
  const [scheduledCount] = useState(8);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Monitor,
      badge: null,
      description: 'Fast Channels'
    },
    {
      id: 'scheduler',
      label: 'EPG Scheduler',
      icon: Calendar,
      badge: scheduledCount,
      description: 'Program scheduling grid'
    },
    {
      id: 'content',
      label: 'Content Library',
      icon: Video,
      badge: null,
      description: 'Video assets and playlists'
    },
    {
      id: 'live',
      label: 'Fast Channels',
      icon: Radio,
      badge: liveCount,
      description: 'EPG Control Center'
    },
    {
      id: 'preview',
      label: 'EPG Preview',
      icon: FileText,
      badge: null,
      description: 'Preview and export'
    }
  ];

  return (
    <div className="bg-card-dark border-r border-border w-64 min-h-screen p-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-broadcast-blue to-broadcast-blue-light rounded-lg flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Slike Studio</h1>
            <p className="text-xs text-muted-foreground">v2.1.0</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Electronic Program Guide Management
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                ${isActive 
                  ? 'bg-broadcast-blue text-white shadow-broadcast' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-control-surface'
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                  {item.badge !== null && (
                    <Badge 
                      className={`ml-2 text-xs ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : item.id === 'live' 
                            ? 'bg-pcr-live text-white animate-pulse-live' 
                            : 'bg-status-scheduled text-black'
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className={`text-xs truncate ${
                  isActive ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="space-y-3 mb-8">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Button variant="control" size="sm" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Export EPG
          </Button>
          <Button variant="live" size="sm" className="w-full justify-start">
            <Radio className="h-4 w-4 mr-2" />
            Go Live Now
          </Button>
          <Button variant="playlist" size="sm" className="w-full justify-start">
            <Video className="h-4 w-4 mr-2" />
            Quick Playlist
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-control-surface rounded-lg p-3">
        <h3 className="text-xs font-semibold text-foreground mb-2">System Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Live Sources</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-pcr-live rounded-full animate-pulse-live"></div>
              <span className="text-foreground">{liveCount}/4</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Scheduled</span>
            <span className="text-status-scheduled">{scheduledCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Storage</span>
            <span className="text-foreground">68%</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-8 pt-4 border-t border-border">
        <Button variant="control" size="sm" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};