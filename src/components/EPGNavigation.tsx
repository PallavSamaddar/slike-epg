import { useState } from 'react';
import { Monitor, Calendar, Video, Radio, Settings, Download, FileText, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const EPGNavigation = ({ activeView, onViewChange }: NavigationProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
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
      label: 'Event EPG',
      icon: Calendar,
      badge: scheduledCount,
      description: 'Program scheduling grid'
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
    <div className={cn("bg-card-dark border-r border-border min-h-screen p-4 transition-all duration-300 ease-in-out", isCollapsed ? 'w-24' : 'w-64')}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
            <div className={cn("flex items-center gap-3", isCollapsed && 'hidden')}>
                <div className="w-8 h-8 bg-gradient-to-br from-broadcast-blue to-broadcast-blue-light rounded-lg flex items-center justify-center">
                    <Radio className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-foreground">Slike Studio</h1>
                    <p className="text-xs text-muted-foreground">v2.1.0</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className={cn(isCollapsed && 'mx-auto')}>
                <Menu className="h-5 w-5" />
            </Button>
        </div>
        {!isCollapsed && (
            <div className="text-xs text-muted-foreground">
                Electronic Program Guide Management
            </div>
        )}
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
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                isActive 
                  ? 'bg-broadcast-blue text-white shadow-broadcast' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-control-surface',
                isCollapsed && "justify-center"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? 'text-white' : '')} />
              <div className={cn("flex-1 min-w-0", isCollapsed && "hidden")}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                  {item.badge !== null && (
                    <Badge 
                      className={cn(
                        "ml-2 text-xs",
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : item.id === 'live' 
                            ? 'bg-pcr-live text-white animate-pulse-live' 
                            : 'bg-status-scheduled text-black'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className={cn("text-xs truncate", isActive ? 'text-white/70' : 'text-muted-foreground')}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
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
      )}
    </div>
  );
};
