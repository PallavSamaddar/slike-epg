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
  
  return (
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
