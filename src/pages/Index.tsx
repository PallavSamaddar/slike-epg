import { useState } from 'react';
import { EPGNavigation } from '@/components/EPGNavigation';
import { EPGScheduler } from '@/components/EPGScheduler';
// removed obsolete imports
import { LiveEventsManager } from '@/components/LiveEventsManager';
import { EPGPreview } from '@/components/EPGPreview';
// removed obsolete import

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <LiveEventsManager onNavigate={setActiveView} />;
      case 'scheduler':
        return <EPGScheduler onNavigate={setActiveView} />;
      case 'preview':
        return <EPGPreview />;
      // removed obsolete routes
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
