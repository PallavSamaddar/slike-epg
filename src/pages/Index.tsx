import { useEffect, useState, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
const EPGScheduler = lazy(() => import('@/components/EPGScheduler').then(m => ({ default: m.EPGScheduler })));
const LiveEventsManager = lazy(() => import('@/components/LiveEventsManager').then(m => ({ default: m.LiveEventsManager })));
const EPGPreview = lazy(() => import('@/components/EPGPreview').then(m => ({ default: m.EPGPreview })));

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const location = useLocation();

  // Guard navigation when there is a draft channel without programs
  const handleViewChange = (nextView: string) => {
    try {
      const draft = localStorage.getItem('fastChannelDraft');
      const hasPrograms = localStorage.getItem('fastChannelDraftHasPrograms') === 'true';
      const isLeavingPreview = activeView === 'preview' && nextView !== 'preview';
      if (draft && !hasPrograms && isLeavingPreview) {
        const confirmLeave = window.confirm(
          'You have not added any programs for this channel. Without programs, the channel cannot be created. Do you want to discard this channel?'
        );
        if (!confirmLeave) return;
        // Discard draft
        localStorage.removeItem('fastChannelDraft');
        localStorage.removeItem('fastChannelDraftHasPrograms');
      }
    } catch {}
    setActiveView(nextView);
  };

  // If a draft exists, force user into Preview to complete setup
  useEffect(() => {
    try {
      const draft = localStorage.getItem('fastChannelDraft');
      if (draft && location.pathname !== '/dashboard') {
        setActiveView('preview');
      } else if (location.pathname === '/dashboard') {
        setActiveView('dashboard');
      }
    } catch {}
  }, [location.pathname]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <LiveEventsManager onNavigate={handleViewChange} />;
      case 'scheduler':
        return <EPGScheduler onNavigate={handleViewChange} />;
      case 'preview':
        return <EPGPreview onNavigate={handleViewChange} />;
      // removed obsolete routes
      default:
        return <LiveEventsManager onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="overflow-auto">
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
          {renderActiveView()}
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
