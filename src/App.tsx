import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import PlaylistManagement from "./components/PlaylistManagement";
import PlaylistCreateEdit from "./components/PlaylistCreateEdit";
import PlaylistCreateEditComplete from "./components/PlaylistCreateEditComplete";
import { ChannelEPG } from "./components/ChannelEPG";
import NotFound from "./pages/NotFound";
import { EPGPreview } from "./components/EPGPreview";
import ErrorBoundary from "./components/ErrorBoundary";
import { setupErrorHandling } from "./utils/errorHandler";
import { ProgramSettingsProvider } from "./contexts/ProgramSettingsContext";
import { defaultPlaylistContent } from "./constants/defaultPlaylist";

const queryClient = new QueryClient();

const EditPlaylistWrapper = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  return (
    <PlaylistCreateEditComplete 
      onNavigate={(view) => navigate(`/${view}`)} 
      isEdit={true} 
      playlistId={id} 
    />
  );
};

const AppRoutes = () => {
  const navigate = useNavigate();
  
  const handleProgramSave = (program: any, videos: any[], source: 'epg-preview' | 'scheduler') => {
    // Dispatch custom event to notify components of the save
    window.dispatchEvent(new CustomEvent('program-saved', { 
      detail: { program, videos, source } 
    }));
  };

  const handleProgramDelete = (program: any, source: 'epg-preview' | 'scheduler') => {
    // Dispatch custom event to notify components of the delete
    window.dispatchEvent(new CustomEvent('program-deleted', { 
      detail: { program, source } 
    }));
  };
  
  return (
    <ProgramSettingsProvider
      onSave={handleProgramSave}
      onDelete={handleProgramDelete}
      defaultPlaylistContent={defaultPlaylistContent}
    >
      <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/playlist-create" element={<PlaylistCreateEditComplete onNavigate={(view) => navigate(`/${view}`)} />} />
          <Route path="/playlists/new" element={<PlaylistCreateEditComplete onNavigate={(view) => navigate(`/${view}`)} />} />
          <Route path="/playlists/:id/edit" element={<EditPlaylistWrapper />} />
          <Route path="/playlists" element={<PlaylistManagement onNavigate={(view) => navigate(`/${view}`)} />} />
          <Route path="/channel-epg" element={<EPGPreview onNavigate={(view) => navigate(`/${view}`)} />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={
            <div style={{ padding: '20px', background: '#ffebee', border: '2px solid red' }}>
              <h1>404 - Route Not Found</h1>
              <p>Current path: {window.location.pathname}</p>
              <p>This is the catch-all route.</p>
            </div>
          } />
      </Routes>
    </ProgramSettingsProvider>
  );
};

const App = () => {
  // Initialize error handling for browser extension errors
  React.useEffect(() => {
    setupErrorHandling();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
