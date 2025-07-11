import { useState } from 'react';
import { EPGNavigation } from '@/components/EPGNavigation';
import { EPGDashboard } from '@/components/EPGDashboard';
import { EPGScheduler } from '@/components/EPGScheduler';
import { ContentLibrary } from '@/components/ContentLibrary';
import { LiveEventsManager } from '@/components/LiveEventsManager';
import { EPGPreview } from '@/components/EPGPreview';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <LiveEventsManager onNavigate={setActiveView} />;
      case 'scheduler':
        return <EPGScheduler />;
      case 'content':
        return <ContentLibrary />;
      case 'live':
        return <EPGDashboard />;
      case 'preview':
        return <EPGPreview />;
      default:
        return <LiveEventsManager onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EPGNavigation activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 overflow-auto">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default Index;
