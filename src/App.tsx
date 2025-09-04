import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PlaylistManagement from "./components/PlaylistManagement";
import PlaylistCreateEdit from "./components/PlaylistCreateEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/playlists" element={<PlaylistManagement onNavigate={(view) => window.location.href = `/${view}`} />} />
          <Route path="/playlists/new" element={<PlaylistCreateEdit onNavigate={(view) => window.location.href = `/${view}`} />} />
          <Route path="/playlists/:id/edit" element={<PlaylistCreateEdit isEdit={true} onNavigate={(view) => window.location.href = `/${view}`} />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
