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
        return <EPGDashboard />;
      case 'scheduler':
        return <EPGScheduler />;
      case 'content':
        return <ContentLibrary />;
      case 'live':
        return <LiveEventsManager onNavigate={setActiveView} />;
      case 'preview':
        return <EPGPreview />;
      default:
        return <EPGDashboard />;
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
