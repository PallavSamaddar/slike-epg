import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProgramSettingsModal } from '@/components/ProgramSettingsModal';

interface Video {
  id: string;
  name: string;
  duration: number;
  type?: 'VOD' | 'Event' | 'Live' | 'YouTube';
  playlistName?: string;
  source?: 'playlist' | 'custom';
}

interface ScheduleBlock {
  id: string;
  time: string;
  duration: number;
  title: string;
  type: 'VOD' | 'Event';
  status: 'scheduled' | 'live' | 'completed';
  geoZone: string;
  tags: string[];
  description?: string;
  videos: Video[];
  playlistId?: string;
  defaultPlaylistContent?: Video[];
}

interface ProgramSettingsContextType {
  openProgramSettings: (program: any, source: 'epg-preview' | 'scheduler') => void;
  closeProgramSettings: () => void;
  saveProgramSettings: (program: ScheduleBlock, videos: Video[]) => void;
  deleteProgram: (program: ScheduleBlock) => void;
  isOpen: boolean;
  selectedProgram: ScheduleBlock | null;
  hasUnsavedChanges: boolean;
  onUnsavedClose: () => void;
}

const ProgramSettingsContext = createContext<ProgramSettingsContextType | undefined>(undefined);

interface ProgramSettingsProviderProps {
  children: ReactNode;
  onSave: (program: ScheduleBlock, videos: Video[], source: 'epg-preview' | 'scheduler') => void;
  onDelete?: (program: ScheduleBlock, source: 'epg-preview' | 'scheduler') => void;
  defaultPlaylistContent?: Video[];
}

export const ProgramSettingsProvider: React.FC<ProgramSettingsProviderProps> = ({
  children,
  onSave,
  onDelete,
  defaultPlaylistContent = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ScheduleBlock | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentSource, setCurrentSource] = useState<'epg-preview' | 'scheduler'>('epg-preview');

  const openProgramSettings = useCallback((program: any, source: 'epg-preview' | 'scheduler') => {
    setCurrentSource(source);
    
    // Get the playlist content based on the program's playlist
    let playlistContent = defaultPlaylistContent;
    
    // If program has a different playlist, you can extend this logic
    if (program.playlist && program.playlist !== "Default Playlist") {
      // In the future, you can add logic to load different playlists
      playlistContent = defaultPlaylistContent;
    }
    
    // Use saved videos if available, otherwise use playlist content
    const videosToUse = program.videos && program.videos.length > 0 
      ? program.videos 
      : playlistContent;
    
    // Transform program to ScheduleBlock format for ProgramSettingsModal
    const transformedProgram: ScheduleBlock = {
      ...program,
      time: program.time?.includes('T') ? program.time.split('T')[1] : program.time, // Extract time part from ISO format if needed
      videos: videosToUse, // Use saved videos or playlist content
      tags: program.genre ? [program.genre] : (program.tags || []), // Convert genre to tags array or use existing tags
      playlistId: program.playlist || program.playlistId || "Default Playlist", // Map playlist to playlistId
      defaultPlaylistContent: playlistContent // Pass the default playlist content for expansion
    };
    
    setSelectedProgram(transformedProgram);
    setHasUnsavedChanges(false);
    setIsOpen(true);
  }, [defaultPlaylistContent]);

  const closeProgramSettings = useCallback(() => {
    if (hasUnsavedChanges) {
      // This will be handled by the modal's onUnsavedClose
      return;
    }
    setIsOpen(false);
    setSelectedProgram(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  const saveProgramSettings = useCallback((program: ScheduleBlock, videos: Video[]) => {
    onSave(program, videos, currentSource);
    setIsOpen(false);
    setSelectedProgram(null);
    setHasUnsavedChanges(false);
  }, [onSave, currentSource]);

  const deleteProgram = useCallback((program: ScheduleBlock) => {
    if (onDelete) {
      onDelete(program, currentSource);
    }
    setIsOpen(false);
    setSelectedProgram(null);
    setHasUnsavedChanges(false);
  }, [onDelete, currentSource]);

  const handleUnsavedClose = useCallback(() => {
    // This will be handled by the modal's internal logic
  }, []);

  const value: ProgramSettingsContextType = {
    openProgramSettings,
    closeProgramSettings,
    saveProgramSettings,
    deleteProgram,
    isOpen,
    selectedProgram,
    hasUnsavedChanges,
    onUnsavedClose: handleUnsavedClose
  };

  return (
    <ProgramSettingsContext.Provider value={value}>
      {children}
      <ProgramSettingsModal
        isOpen={isOpen}
        onClose={closeProgramSettings}
        onSave={saveProgramSettings}
        onDelete={onDelete ? deleteProgram : undefined}
        program={selectedProgram}
        hasUnsavedChanges={hasUnsavedChanges}
        onUnsavedClose={handleUnsavedClose}
      />
    </ProgramSettingsContext.Provider>
  );
};

export const useProgramSettings = () => {
  const context = useContext(ProgramSettingsContext);
  if (context === undefined) {
    throw new Error('useProgramSettings must be used within a ProgramSettingsProvider');
  }
  return context;
};
