import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileText,
  Code,
  Database,
  Settings,
  RefreshCw,
  Plus,
  Copy,
  Edit,
  GripVertical,
  ClipboardCopy,
  FileDown,
  ChevronDown,
  Check,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ManageAdsModal } from "./ManageAdsModal";
import { RepeatScheduleModal } from "./RepeatScheduleModal";
import { ProgramSettingsModal } from "./ProgramSettingsModal";
import { CreateProgramModal } from "./CreateProgramModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import WeeklyView from "./WeeklyView";
import MonthlyView from "./MonthlyView";
import { EPGScheduler } from "./EPGScheduler";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EPGPreviewItem {
  id: string;
  time: string;
  title: string;
  type: "VOD" | "Event";
  duration: number;
  geoZone: string;
  description?: string;
  status: "live" | "scheduled" | "completed";
  genre: string;
  playlist?: string;
  isEditing?: boolean;
  imageUrl?: string;
  customContentCount?: number; // Track number of custom videos
  customContentDuration?: number; // Track duration of custom content
  videos?: any[]; // Store the actual videos (playlist + custom content)
}

const SortableItem = ({
  id,
  children,
}: {
  id: string;
  children: (listeners: Record<string, unknown>) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
};

// Function to get random poster image
const getRandomPoster = () => {
  const posters = [
    "/poster-1.jpg",
    "/poster-2.jpg",
    "/poster-3.jpg",
    "/poster-4.jpg",
    "/poster-5.jpg",
    "/poster-6.jpg",
  ];
  return posters[Math.floor(Math.random() * posters.length)];
};

const generateDummyProgramsForDate = (
  date: Date,
  idOffset: number
): EPGPreviewItem[] => {
  const dateString = date.toISOString().split("T")[0];
  return [
    {
      id: `d-${idOffset + 1}`,
      time: `${dateString}T09:00`,
      title: "Morning Show",
      type: "Event",
      duration: 120,
      geoZone: "Global",
      description: "A morning talk show.",
      status: "scheduled",
      genre: "Talk Show",
      playlist: "Default Playlist",
      imageUrl: getRandomPoster(),
    },
    {
      id: `d-${idOffset + 2}`,
      time: `${dateString}T11:00`,
      title: "Cartoon Fun",
      type: "VOD",
      duration: 60,
      geoZone: "Global",
      description: "Animated series for kids.",
      status: "scheduled",
      genre: "Kids",
      playlist: "Default Playlist",
      imageUrl: getRandomPoster(),
    },
    {
      id: `d-${idOffset + 3}`,
      time: `${dateString}T15:00`,
      title: "Indie Films",
      type: "VOD",
      duration: 180,
      geoZone: "US/EU",
      description: "A selection of independent movies.",
      status: "scheduled",
      genre: "Movies",
      playlist: "Tech Reviews",
      imageUrl: getRandomPoster(),
    },
    {
      id: `d-${idOffset + 4}`,
      time: `${dateString}T20:00`,
      title: "Rock Anthems",
      type: "VOD",
      duration: 60,
      geoZone: "Global",
      description: "Classic rock music videos.",
      status: "scheduled",
      genre: "Music",
      playlist: "Music Mix",
      imageUrl: getRandomPoster(),
    },
  ];
};

type ViewMode = "daily" | "weekly" | "monthly";

export const EPGPreview = ({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) => {
  // Default playlist with 100+ VOD content items
  // Helper function to format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  };

  // Helper function to get content counts for a program
  const getProgramContentInfo = (program: any) => {
    // Use saved videos if available, otherwise use default playlist
    const videos = program.videos || defaultPlaylistContent;
    
    
    // Count videos by source
    const playlistVideos = videos.filter(video => video.source === 'playlist').length;
    const customVideos = videos.filter(video => video.source === 'custom').length;
    
    // Calculate durations
    const playlistDuration = videos
      .filter(video => video.source === 'playlist')
      .reduce((total, video) => total + (video.duration || 0), 0);
    const customDuration = videos
      .filter(video => video.source === 'custom')
      .reduce((total, video) => total + (video.duration || 0), 0);
    
    const totalContentDuration = playlistDuration + customDuration;
    const programDurationMinutes = program.duration * 60; // Convert hours to minutes
    
    
    return {
      playlistVideos,
      customVideos,
      playlistDuration,
      customDuration,
      totalContentDuration,
      programDuration: programDurationMinutes
    };
  };

  // Memoize the default playlist content to avoid recreation on every render
  const defaultPlaylistContent = useMemo(() => [
    { id: 'vod-1', name: 'Action Movie Collection', duration: 120, type: 'VOD', source: 'playlist' },
    { id: 'vod-2', name: 'Comedy Special', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-3', name: 'Documentary Series', duration: 60, type: 'VOD', source: 'playlist' },
    { id: 'vod-4', name: 'Romantic Drama', duration: 110, type: 'VOD', source: 'playlist' },
    { id: 'vod-5', name: 'Thriller Night', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-6', name: 'Family Adventure', duration: 100, type: 'VOD', source: 'playlist' },
    { id: 'vod-7', name: 'Sci-Fi Classic', duration: 130, type: 'VOD', source: 'playlist' },
    { id: 'vod-8', name: 'Horror Showcase', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-9', name: 'Musical Extravaganza', duration: 140, type: 'VOD', source: 'playlist' },
    { id: 'vod-10', name: 'Crime Investigation', duration: 75, type: 'VOD', source: 'playlist' },
    { id: 'vod-11', name: 'Fantasy Quest', duration: 125, type: 'VOD', source: 'playlist' },
    { id: 'vod-12', name: 'Sports Documentary', duration: 55, type: 'VOD', source: 'playlist' },
    { id: 'vod-13', name: 'Historical Drama', duration: 105, type: 'VOD', source: 'playlist' },
    { id: 'vod-14', name: 'Animation Collection', duration: 80, type: 'VOD', source: 'playlist' },
    { id: 'vod-15', name: 'Mystery Thriller', duration: 115, type: 'VOD', source: 'playlist' },
    { id: 'vod-16', name: 'Comedy Stand-up', duration: 65, type: 'VOD', source: 'playlist' },
    { id: 'vod-17', name: 'Adventure Series', duration: 135, type: 'VOD', source: 'playlist' },
    { id: 'vod-18', name: 'Drama Series', duration: 70, type: 'VOD', source: 'playlist' },
    { id: 'vod-19', name: 'Action Thriller', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-20', name: 'Romantic Comedy', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-21', name: 'Superhero Saga', duration: 150, type: 'VOD', source: 'playlist' },
    { id: 'vod-22', name: 'War Documentary', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-23', name: 'Nature Special', duration: 60, type: 'VOD', source: 'playlist' },
    { id: 'vod-24', name: 'Music Concert', duration: 120, type: 'VOD', source: 'playlist' },
    { id: 'vod-25', name: 'Comedy Movie', duration: 100, type: 'VOD', source: 'playlist' },
    { id: 'vod-26', name: 'Drama Film', duration: 110, type: 'VOD', source: 'playlist' },
    { id: 'vod-27', name: 'Action Blockbuster', duration: 140, type: 'VOD', source: 'playlist' },
    { id: 'vod-28', name: 'Thriller Series', duration: 75, type: 'VOD', source: 'playlist' },
    { id: 'vod-29', name: 'Romance Collection', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-30', name: 'Horror Classic', duration: 80, type: 'VOD', source: 'playlist' },
    { id: 'vod-31', name: 'Sci-Fi Adventure', duration: 125, type: 'VOD', source: 'playlist' },
    { id: 'vod-32', name: 'Family Movie', duration: 105, type: 'VOD', source: 'playlist' },
    { id: 'vod-33', name: 'Comedy Series', duration: 65, type: 'VOD', source: 'playlist' },
    { id: 'vod-34', name: 'Drama Special', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-35', name: 'Action Series', duration: 115, type: 'VOD', source: 'playlist' },
    { id: 'vod-36', name: 'Documentary Film', duration: 70, type: 'VOD', source: 'playlist' },
    { id: 'vod-37', name: 'Musical Drama', duration: 130, type: 'VOD', source: 'playlist' },
    { id: 'vod-38', name: 'Crime Drama', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-39', name: 'Fantasy Adventure', duration: 135, type: 'VOD', source: 'playlist' },
    { id: 'vod-40', name: 'Sports Movie', duration: 100, type: 'VOD', source: 'playlist' },
    { id: 'vod-41', name: 'Historical Film', duration: 120, type: 'VOD', source: 'playlist' },
    { id: 'vod-42', name: 'Animation Movie', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-43', name: 'Mystery Series', duration: 75, type: 'VOD', source: 'playlist' },
    { id: 'vod-44', name: 'Comedy Special', duration: 60, type: 'VOD', source: 'playlist' },
    { id: 'vod-45', name: 'Adventure Movie', duration: 110, type: 'VOD', source: 'playlist' },
    { id: 'vod-46', name: 'Drama Series', duration: 80, type: 'VOD', source: 'playlist' },
    { id: 'vod-47', name: 'Action Adventure', duration: 125, type: 'VOD', source: 'playlist' },
    { id: 'vod-48', name: 'Romantic Drama', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-49', name: 'Superhero Movie', duration: 145, type: 'VOD', source: 'playlist' },
    { id: 'vod-50', name: 'War Film', duration: 140, type: 'VOD', source: 'playlist' },
    { id: 'vod-51', name: 'Nature Documentary', duration: 55, type: 'VOD', source: 'playlist' },
    { id: 'vod-52', name: 'Music Video Collection', duration: 65, type: 'VOD', source: 'playlist' },
    { id: 'vod-53', name: 'Comedy Movie Night', duration: 105, type: 'VOD', source: 'playlist' },
    { id: 'vod-54', name: 'Drama Feature', duration: 115, type: 'VOD', source: 'playlist' },
    { id: 'vod-55', name: 'Action Packed', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-56', name: 'Thriller Night', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-57', name: 'Romance Special', duration: 100, type: 'VOD', source: 'playlist' },
    { id: 'vod-58', name: 'Horror Night', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-59', name: 'Sci-Fi Collection', duration: 130, type: 'VOD', source: 'playlist' },
    { id: 'vod-60', name: 'Family Fun', duration: 80, type: 'VOD', source: 'playlist' },
    { id: 'vod-61', name: 'Comedy Hour', duration: 70, type: 'VOD', source: 'playlist' },
    { id: 'vod-62', name: 'Drama Night', duration: 110, type: 'VOD', source: 'playlist' },
    { id: 'vod-63', name: 'Action Thrills', duration: 120, type: 'VOD', source: 'playlist' },
    { id: 'vod-64', name: 'Documentary Special', duration: 75, type: 'VOD', source: 'playlist' },
    { id: 'vod-65', name: 'Musical Night', duration: 135, type: 'VOD', source: 'playlist' },
    { id: 'vod-66', name: 'Crime Story', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-67', name: 'Fantasy Quest', duration: 125, type: 'VOD', source: 'playlist' },
    { id: 'vod-68', name: 'Sports Action', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-69', name: 'Historical Epic', duration: 150, type: 'VOD', source: 'playlist' },
    { id: 'vod-70', name: 'Animation Fun', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-71', name: 'Mystery Thriller', duration: 105, type: 'VOD', source: 'playlist' },
    { id: 'vod-72', name: 'Comedy Gold', duration: 65, type: 'VOD', source: 'playlist' },
    { id: 'vod-73', name: 'Adventure Quest', duration: 140, type: 'VOD', source: 'playlist' },
    { id: 'vod-74', name: 'Drama Classic', duration: 100, type: 'VOD', source: 'playlist' },
    { id: 'vod-75', name: 'Action Hero', duration: 115, type: 'VOD', source: 'playlist' },
    { id: 'vod-76', name: 'Documentary Insight', duration: 60, type: 'VOD', source: 'playlist' },
    { id: 'vod-77', name: 'Musical Magic', duration: 120, type: 'VOD', source: 'playlist' },
    { id: 'vod-78', name: 'Crime Investigation', duration: 80, type: 'VOD', source: 'playlist' },
    { id: 'vod-79', name: 'Fantasy World', duration: 130, type: 'VOD', source: 'playlist' },
    { id: 'vod-80', name: 'Sports Highlights', duration: 70, type: 'VOD', source: 'playlist' },
    { id: 'vod-81', name: 'Historical Journey', duration: 110, type: 'VOD', source: 'playlist' },
    { id: 'vod-82', name: 'Animation Adventure', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-83', name: 'Mystery Case', duration: 75, type: 'VOD', source: 'playlist' },
    { id: 'vod-84', name: 'Comedy Show', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-85', name: 'Adventure Series', duration: 125, type: 'VOD', source: 'playlist' },
    { id: 'vod-86', name: 'Drama Series', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-87', name: 'Action Blockbuster', duration: 145, type: 'VOD', source: 'playlist' },
    { id: 'vod-88', name: 'Thriller Series', duration: 100, type: 'VOD', source: 'playlist' },
    { id: 'vod-89', name: 'Romance Collection', duration: 105, type: 'VOD', source: 'playlist' },
    { id: 'vod-90', name: 'Horror Collection', duration: 80, type: 'VOD', source: 'playlist' },
    { id: 'vod-91', name: 'Sci-Fi Series', duration: 135, type: 'VOD', source: 'playlist' },
    { id: 'vod-92', name: 'Family Collection', duration: 95, type: 'VOD', source: 'playlist' },
    { id: 'vod-93', name: 'Comedy Collection', duration: 70, type: 'VOD', source: 'playlist' },
    { id: 'vod-94', name: 'Drama Collection', duration: 115, type: 'VOD', source: 'playlist' },
    { id: 'vod-95', name: 'Action Collection', duration: 120, type: 'VOD', source: 'playlist' },
    { id: 'vod-96', name: 'Documentary Collection', duration: 65, type: 'VOD', source: 'playlist' },
    { id: 'vod-97', name: 'Musical Collection', duration: 140, type: 'VOD', source: 'playlist' },
    { id: 'vod-98', name: 'Crime Collection', duration: 85, type: 'VOD', source: 'playlist' },
    { id: 'vod-99', name: 'Fantasy Collection', duration: 130, type: 'VOD', source: 'playlist' },
    { id: 'vod-100', name: 'Sports Collection', duration: 75, type: 'VOD', source: 'playlist' },
    { id: 'vod-101', name: 'Historical Collection', duration: 125, type: 'VOD', source: 'playlist' },
    { id: 'vod-102', name: 'Animation Collection', duration: 90, type: 'VOD', source: 'playlist' },
    { id: 'vod-103', name: 'Mystery Collection', duration: 105, type: 'VOD', source: 'playlist' },
    { id: 'vod-104', name: 'Comedy Special Collection', duration: 60, type: 'VOD', source: 'playlist' },
    { id: 'vod-105', name: 'Adventure Collection', duration: 135, type: 'VOD', source: 'playlist' }
  ].map(item => ({
    ...item,
    source: 'playlist' as const,
    playlistName: 'Default Playlist'
  })), []);
  const [selectedFormat, setSelectedFormat] = useState("xmltv");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [distributor, setDistributor] = useState("Gracenote");
  const [activeTab, setActiveTab] = useState("master-epg");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("epgViewMode") as ViewMode) || "daily";
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectDateTabLabel, setSelectDateTabLabel] = useState("Select Date");

  // Tab management state
  const [tabs, setTabs] = useState([
    { id: "preview", label: "EPG Preview", isStatic: true, isClosable: false },
    { id: "scheduler", label: "Scheduler", isStatic: true, isClosable: false },
    { id: "calendar", label: "Calendar", isStatic: true, isClosable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState("preview");

  const [isManageAdsModalOpen, setIsManageAdsModalOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [editingGenres, setEditingGenres] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSelectDateCalendarOpen, setIsSelectDateCalendarOpen] =
    useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [isExportSettingsModalOpen, setIsExportSettingsModalOpen] =
    useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftChannel, setDraftChannel] = useState<null | {
    id: string;
    name: string;
    description?: string;
    posterDataUrl?: string;
    resolution?: string;
    primaryGenre?: string | null;
    language?: string | null;
  }>(null);
  const isDraftMode = !!draftChannel;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem("epgViewMode", viewMode);
  }, [viewMode]);

  // No longer need to update tabs based on selectDateTabLabel since we have a different structure

  // Handle click outside calendar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectDateCalendarOpen) {
        const target = event.target as HTMLElement;
        // Check if click is outside the calendar dropdown
        if (
          !target.closest(".calendar-dropdown") &&
          !target.closest('[data-tab-id="select-date"]') &&
          !target.closest('button[data-calendar-trigger]')
        ) {
          setIsSelectDateCalendarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSelectDateCalendarOpen]);

  // Update calendar position on scroll or resize
  useEffect(() => {
    const updatePosition = () => {
      if (isSelectDateCalendarOpen && calendarButtonRef.current) {
        const rect = calendarButtonRef.current.getBoundingClientRect();
        setCalendarPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX
        });
      }
    };

    if (isSelectDateCalendarOpen) {
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isSelectDateCalendarOpen]);

  // Handle tab switching
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    // do not reset unsaved flag on view switches; keep changes until saved

    // Map tab IDs to view modes and active tabs
    switch (tabId) {
      case "preview":
        setActiveTab("preview");
        break;
      case "scheduler":
        setActiveTab("scheduler");
        break;
      case "calendar":
        setActiveTab("calendar");
        setViewMode("weekly"); // Default to weekly view for calendar tab
        break;
      default:
        break;
    }
  };

  // Centralized navigation: open a specific date in Select Date tab
  const goToDateInSelectDateTab = (date: Date) => {
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0
    );
    const dateLabel = normalized.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setSelectDateTabLabel(dateLabel);
    setSelectedDate(normalized);
    setActiveTab("schedule-view");
    setActiveTabId("select-date");
    setIsSelectDateCalendarOpen(false);
    setHasUnsavedChanges(false);
  };

  const handleDateChangeFromCalendar = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    goToDateInSelectDateTab(date);
  };

  // Save button enablement and tooltip messages
  const isSaveEpgEnabled = (): boolean => {
    if (activeTabId === "calendar") return false; // Calendar tab is view-only
    if (activeTabId === "scheduler") return false; // Scheduler tab has its own save functionality
    return hasUnsavedChanges;
  };

  const getSaveEpgTooltipMessage = (): string => {
    if (activeTabId === "calendar") return "Calendar view is read-only";
    if (activeTabId === "scheduler")
      return "Scheduler has its own save functionality";
    if (!hasUnsavedChanges) return "No changes to save";
    return "";
  };

  // Removed - no longer needed with new structure

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "d":
          setViewMode("daily");
          break;
        case "w":
          setViewMode("weekly");
          break;
        case "m":
          setViewMode("monthly");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [mockEPGData, setMockEPGData] = useState<EPGPreviewItem[]>(() => {
    try {
      const rawDraft = localStorage.getItem("fastChannelDraft");
      if (rawDraft) {
        return [];
      }
    } catch {
      // Error accessing localStorage
    }
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const initialPrograms: EPGPreviewItem[] = [];
    const genres = [
      "News",
      "Movies",
      "Sports",
      "Music",
      "Comedy",
      "Documentary",
      "Talk Show",
      "Games",
      "Cooking",
    ];
    const playlists = [
      "Default Playlist",
      "Sports Highlights",
      "Music Mix",
      "Tech Reviews",
    ];
    const titles = [
      "Midnight Kickoff",
      "Early Hour Highlights",
      "Dawn Documentaries",
      "Sunrise Show",
      "Morning Mix",
      "Daily Briefing",
      "Brunch Beats",
      "Noon News",
      "Afternoon Feature",
      "Tea Time Talk",
      "Drive Time Hits",
      "Evening Update",
      "Prime Stories",
      "Family Hour",
      "Twilight Tunes",
      "Dusk Drama",
      "Evening Magazine",
      "Pre-Prime Recap",
      "Prime Preview",
      "Late Rush",
      "Late Feature",
    ];
    // Build hourly programs from 00:00 to 20:00
    for (let hour = 0; hour <= 20; hour++) {
      const hh = String(hour).padStart(2, "0");
      const title = titles[hour % titles.length] || `Program ${hh}:00`;
      const genre = genres[hour % genres.length];
      const playlist = playlists[hour % playlists.length];
      initialPrograms.push({
        id: `m-${hour}`,
        time: `${todayStr}T${hh}:00`,
        title,
        type: hour % 2 === 0 ? "VOD" : "Event",
        duration: 60,
        geoZone: "Global",
        description: `${title} - ${genre} segment`,
        status: "scheduled",
        genre,
        playlist,
        imageUrl: getRandomPoster(),
      });
    }

    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      initialPrograms.push(
        ...generateDummyProgramsForDate(nextDate, initialPrograms.length)
      );
    }

    for (let i = 1; i <= 3; i++) {
      const prevDate = new Date();
      prevDate.setDate(today.getDate() - i);
      initialPrograms.push(
        ...generateDummyProgramsForDate(prevDate, initialPrograms.length)
      );
    }

    const nextMonthDate = new Date();
    nextMonthDate.setMonth(today.getMonth() + 1, 5);
    initialPrograms.push(
      ...generateDummyProgramsForDate(nextMonthDate, initialPrograms.length)
    );

    return initialPrograms;
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fastChannelDraft");
      setDraftChannel(raw ? JSON.parse(raw) : null);
    } catch {
      setDraftChannel(null);
    }
  }, []);

  // If navigated here from Copy EPG button on channel card, open the modal
  useEffect(() => {
    try {
      const flag = localStorage.getItem("epg:openCopyModal");
      if (flag) {
        setIsRepeatModalOpen(true);
        localStorage.removeItem("epg:openCopyModal");
      }
    } catch {
      // Error accessing localStorage
    }
  }, []);

  // Warn on page close if draft exists and no programs have been added
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      const hasDraft = !!localStorage.getItem("fastChannelDraft");
      const hasPrograms =
        mockEPGData.length > 0 ||
        localStorage.getItem("fastChannelDraftHasPrograms") === "true";
      if (hasDraft && !hasPrograms) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [mockEPGData.length]);

  // Memoized slices to reduce filtering work per render
  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayPrograms = useMemo(
    () => mockEPGData.filter((i) => i.time.startsWith(todayKey)),
    [mockEPGData, todayKey]
  );
  const selectedKey = useMemo(
    () => selectedDate.toISOString().split("T")[0],
    [selectedDate]
  );
  const selectedDayPrograms = useMemo(
    () => mockEPGData.filter((i) => i.time.startsWith(selectedKey)),
    [mockEPGData, selectedKey]
  );

  // Persist a single day's programs for TOI Global to consume
  const persistDaySchedule = (date: Date) => {
    const key = `epg:preview:day:${date.toISOString().split("T")[0]}`;
    const dayStr = date.toISOString().split("T")[0];
    const dayItems = mockEPGData.filter((p) => p.time.startsWith(dayStr));
    try {
      localStorage.setItem(key, JSON.stringify(dayItems));
      // Dispatch custom event to notify Scheduler tab of the update
      window.dispatchEvent(new CustomEvent('epg-preview-data-updated'));
    } catch {
      // Error persisting to localStorage
    }
  };

  const handleAdSave = (adConfig: Record<string, unknown>) => {
    setIsManageAdsModalOpen(false);
  };

  const handleRepeatSave = (
    startDate: string,
    endDate: string,
    selectedDays: number[]
  ) => {
    setIsRepeatModalOpen(false);
  };

  const { toast } = useToast();

  // Program Settings Modal handlers
  const openProgramSettings = useCallback((program: any) => {
    // Get the playlist content based on the program's playlist
    let playlistContent = defaultPlaylistContent;
    
    // If program has a different playlist, you can extend this logic
    // For now, all programs use the default playlist
    if (program.playlist && program.playlist !== "Default Playlist") {
      // In the future, you can add logic to load different playlists
      // For now, we'll use the default playlist
      playlistContent = defaultPlaylistContent;
    }
    
    // Use saved videos if available, otherwise use playlist content
    const videosToUse = program.videos && program.videos.length > 0 
      ? program.videos 
      : playlistContent;
    
    // If this is an existing program without videos, update it in mockEPGData
    if (!program.videos && program.id && !program.id.startsWith('new-')) {
      setMockEPGData(prev => 
        prev.map(item => 
          item.id === program.id 
            ? { ...item, videos: playlistContent }
            : item
        )
      );
    }
    
    // Transform EPGPreviewItem to ScheduleBlock format for ProgramSettingsModal
    const transformedProgram = {
      ...program,
      time: program.time.split('T')[1], // Extract time part from ISO format (e.g., "2025-09-14T01:00" -> "01:00")
      videos: videosToUse, // Use saved videos or playlist content
      tags: program.genre ? [program.genre] : [], // Convert genre to tags array
      playlistId: program.playlist || "Default Playlist" // Map playlist to playlistId
    };
    setSelectedProgram(transformedProgram);
    setHasProgramChanges(false);
    setIsProgramSettingsOpen(true);
  }, [defaultPlaylistContent, setMockEPGData]);

  const closeProgramSettings = () => {
    if (hasProgramChanges) {
      setShowUnsavedConfirm(true);
    } else {
      setIsProgramSettingsOpen(false);
      setSelectedProgram(null);
      setHasProgramChanges(false);
    }
  };

  // Create Program Modal handlers
  const handleCreateProgram = useCallback((program: any) => {
    // Convert the program data to match the expected format
    const newProgram: EPGPreviewItem = {
      id: program.id,
      time: program.time,
      title: program.title,
      type: program.type,
      duration: program.duration,
      geoZone: program.geoZone,
      description: program.description,
      status: program.status,
      genre: program.genre,
      playlist: program.playlist,
      imageUrl: program.imageUrl,
    };

    // Add to the mock data and sort by time
    setMockEPGData(prev => {
      const updated = [...prev, newProgram];
      return updated.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });
    });

    setHasUnsavedChanges(true);
    setIsCreateProgramModalOpen(false);
    
    // Highlight the new program
    setHighlightedProgramId(newProgram.id);
    setTimeout(() => setHighlightedProgramId(null), 3000); // Remove highlight after 3 seconds
    
    // Mark draft as having programs
    try {
      if (localStorage.getItem('fastChannelDraft')) {
        localStorage.setItem('fastChannelDraftHasPrograms', 'true');
      }
    } catch {}
  }, []);

  const handleUnsavedClose = () => {
    setShowUnsavedConfirm(true);
  };

  const confirmDiscard = () => {
    setIsProgramSettingsOpen(false);
    setSelectedProgram(null);
    setHasProgramChanges(false);
    setShowUnsavedConfirm(false);
  };

  const cancelDiscard = () => {
    setShowUnsavedConfirm(false);
  };

  const saveProgramSettings = (program: any, videos: any[]) => {
    // Calculate custom content statistics
    const customVideos = videos.filter(video => video.source === 'custom');
    const customContentCount = customVideos.length;
    const customContentDuration = customVideos.reduce((total, video) => total + (video.duration || 0), 0);
    
    
    // Update the program in mockEPGData
    setMockEPGData(prev => 
      prev.map(item => 
        item.id === program.id 
          ? { 
              ...item, 
              title: program.title,
              type: program.type,
              duration: program.duration,
              geoZone: program.geoZone,
              description: program.description,
              status: program.status,
              genre: program.tags?.[0] || item.genre, // Map tags to genre
              playlist: program.playlist,
              customContentCount, // Track custom content count
              customContentDuration, // Track custom content duration
              videos, // Store the actual videos (playlist + custom content)
              // Reconstruct the ISO time format from the simple time format
              time: item.time.includes('T') ? 
                item.time.split('T')[0] + 'T' + program.time : 
                program.time
            }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setIsProgramSettingsOpen(false);
    setSelectedProgram(null);
    setHasProgramChanges(false);
    
    
    toast({
      title: 'Program updated',
      description: 'Program settings have been saved successfully.',
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMockEPGData((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return items; // One of the items not found, do not update
        }

        const liveItemIndex = items.findIndex((item) => item.status === "live");

        // Prevent dropping items at or before the live program only in schedule-view
        if (
          activeTab === "schedule-view" &&
          liveItemIndex !== -1 &&
          newIndex <= liveItemIndex
        ) {
          toast({
            title: "Action Restricted",
            description: "Cannot move items above the live program.",
            variant: "destructive",
          });
          return items;
        }

        // Reorder the items
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Auto-update times based on new positions for scheduled items
        const updatedItems = reorderedItems.map((item, index) => {
          if (item.status === "scheduled") {
            // Calculate new time based on position in the daily programs list
            // We need to find the position among all programs for this day
            const dayStr = item.time.split('T')[0];
            const dailyPrograms = reorderedItems.filter(p => p.time.startsWith(dayStr));
            const dailyIndex = dailyPrograms.findIndex(dailyItem => dailyItem.id === item.id);
            
            if (dailyIndex !== -1) {
              // Calculate time based on position (each program is 60 minutes)
              // Start from 00:00 and add 60 minutes for each program
              const totalMinutes = dailyIndex * 60;
              const newHour = Math.floor(totalMinutes / 60);
              const newMinute = totalMinutes % 60;
              const timeString = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
              
              // Update the time in the format "YYYY-MM-DDTHH:MM"
              const updatedItem = {
                ...item,
                time: `${dayStr}T${timeString}`
              };
              
              // Debug log to verify time updates
              
              return updatedItem;
            }
          }
          return item;
        });

        return updatedItems;
      });
      setHasUnsavedChanges(true);
      
      // Immediately sync to Scheduler tab by saving to localStorage
      // Use setTimeout to ensure state is updated before saving
      setTimeout(() => {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const dayItems = mockEPGData.filter((p) => p.time.startsWith(todayStr));
        try {
          localStorage.setItem(`epg:preview:day:${todayStr}`, JSON.stringify(dayItems));
          // Dispatch custom event to notify Scheduler tab of the update
          window.dispatchEvent(new CustomEvent('epg-preview-data-updated'));
        } catch {
          // Error persisting to localStorage
        }
      }, 0);
    }
  };


  // Program Settings Modal state
  const [isProgramSettingsOpen, setIsProgramSettingsOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [hasProgramChanges, setHasProgramChanges] = useState(false);
  
  // Create Program Modal state
  const [isCreateProgramModalOpen, setIsCreateProgramModalOpen] = useState(false);
  const [highlightedProgramId, setHighlightedProgramId] = useState<string | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const minutesToTimeAMPM = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMins = mins.toString().padStart(2, "0");
    return `${displayHours}:${displayMins}${ampm}`;
  };

  const availableGenres = [
    "Movies",
    "Classic",
    "Games",
    "Fun",
    "Sports",
    "News",
    "Entertainment",
    "Documentary",
    "Drama",
    "Comedy",
    "Action",
    "Thriller",
    "Romance",
    "Family",
    "Kids",
    "Weather",
    "Talk Show",
    "Quiz",
    "Lifestyle",
    "Finance",
    "Music",
    "World",
    "Cooking",
  ];

  const toggleEditMode = (id: string) => {
    setMockEPGData((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isEditing: !item.isEditing }
          : { ...item, isEditing: false }
      )
    );
    // editing toggle does not mark changes yet
  };

  const toggleGenreEdit = (id: string) => {
    setEditingGenres(editingGenres === id ? null : id);
  };

  const updateGenre = (id: string, newGenre: string) => {
    setMockEPGData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, genre: newGenre } : item))
    );
    setEditingGenres(null);
    setHasUnsavedChanges(true);
  };


  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEpg = () => {
    // If in draft mode, enforce at least one program before creation
    if (isDraftMode) {
      if (mockEPGData.length === 0) {
        toast({
          title: "Add at least one program",
          description:
            "Please add a program to your new channel before saving.",
          variant: "destructive",
        });
        return;
      }
    }
    // Save Preview EPG for next 15 days
    if (activeTabId === "preview") {
      setIsSaving(true);
      setTimeout(() => {
        const today = new Date();
        const todayString = today.toISOString().split("T")[0];

        const masterPrograms = mockEPGData.filter((p) =>
          p.time.startsWith(todayString)
        );

        const nonMasterDayPrograms = mockEPGData.filter(
          (p) => !p.time.startsWith(todayString)
        );

        const futureDates: string[] = [];
        for (let i = 1; i <= 15; i++) {
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + i);
          futureDates.push(futureDate.toISOString().split("T")[0]);
        }

        const newFuturePrograms = futureDates.flatMap((date) =>
          masterPrograms.map((p) => ({
            ...p,
            id: `${p.id}-mastercopy-${date}-${Math.random()}`,
            time: `${date}T${p.time.split("T")[1]}`,
            status: "scheduled" as const,
          }))
        );

        const programsToKeep = nonMasterDayPrograms.filter(
          (p) => !futureDates.includes(p.time.split("T")[0])
        );

        setMockEPGData([
          ...masterPrograms,
          ...programsToKeep,
          ...newFuturePrograms,
        ]);
        // Persist today's schedule for TOI Global
        persistDaySchedule(today);
        setIsSaving(false);
        setHasUnsavedChanges(false);
        toast({
          title: "Master EPG saved",
          description: "Master EPG saved and updated for the next 15 days.",
        });
        // Finalize draft channel after a successful save
        if (isDraftMode) {
          try {
            const draftRaw = localStorage.getItem("fastChannelDraft");
            if (draftRaw) {
              const draft = JSON.parse(draftRaw);
              const rawList = localStorage.getItem("fastChannels");
              const list = rawList ? JSON.parse(rawList) : [];
              list.push({
                id: draft.id,
                name: draft.name,
                resolution: draft.resolution || "1080p",
                status: "offline",
                posterDataUrl: draft.posterDataUrl,
                language: draft.language,
              });
              localStorage.setItem("fastChannels", JSON.stringify(list));
            }
          } catch {
            // Error accessing localStorage
          }
          localStorage.removeItem("fastChannelDraft");
          localStorage.removeItem("fastChannelDraftHasPrograms");
          setDraftChannel(null);
          toast({
            title: "Channel created",
            description: "Your channel has been created in Offline mode.",
          });
        }
      }, 500);
      return;
    }

    // Save single-day EPG for selected date views (handled in preview tab now)
    if (activeTabId === "preview" && viewMode === "daily") {
      const dateToSave = selectedDate;
      const formatted = dateToSave.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      setIsSaving(true);
      setTimeout(() => {
        // Persist only this selected date
        persistDaySchedule(dateToSave);
        setIsSaving(false);
        setHasUnsavedChanges(false);
        toast({
          title: "EPG saved",
          description: `Schedule for ${formatted} saved successfully.`,
        });
        if (isDraftMode) {
          try {
            const draftRaw = localStorage.getItem("fastChannelDraft");
            if (draftRaw) {
              const draft = JSON.parse(draftRaw);
              const rawList = localStorage.getItem("fastChannels");
              const list = rawList ? JSON.parse(rawList) : [];
              list.push({
                id: draft.id,
                name: draft.name,
                resolution: draft.resolution || "1080p",
                status: "offline",
                posterDataUrl: draft.posterDataUrl,
                language: draft.language,
              });
              localStorage.setItem("fastChannels", JSON.stringify(list));
            }
          } catch {
            // Error accessing localStorage
          }
          localStorage.removeItem("fastChannelDraft");
          localStorage.removeItem("fastChannelDraftHasPrograms");
          setDraftChannel(null);
          toast({
            title: "Channel created",
            description: "Your channel has been created in Offline mode.",
          });
        }
      }, 400);
      return;
    }

    // Calendar and Scheduler tabs don't use this save function
    toast({
      title: "Save not available",
      description: "Switch to EPG Preview tab to save EPG changes.",
      variant: "destructive",
    });
  };

  const ProgramItem = ({
    item,
    isDraggable,
    listeners,
    showStatus = true,
  }: {
    item: EPGPreviewItem;
    isDraggable: boolean;
    listeners?: Record<string, unknown>;
    showStatus?: boolean;
  }) => {
    return (
      <div className={`p-3 rounded bg-background border border-border flex items-start gap-4 transition-all duration-500 ${
        highlightedProgramId === item.id 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' 
          : ''
      }`}>
        <div className="flex-shrink-0 w-40 text-center">
          <div className="w-40 h-24 overflow-hidden rounded-sm">
            <img
              loading="lazy"
              src={item.imageUrl || "/toi_global_poster.png"}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-mono text-broadcast-blue mt-1">
            {formatTimeRange(item.time.split("T")[1], item.duration)}
          </span>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isDraggable && (
                <GripVertical className="cursor-grab" {...listeners} />
              )}
              {item.isEditing ? (
                <Input
                  value={item.title}
                  onChange={(e) => {
                    setMockEPGData((prev) =>
                      prev.map((i) =>
                        i.id === item.id ? { ...i, title: e.target.value } : i
                      )
                    );
                    setHasUnsavedChanges(true);
                  }}
                  onBlur={() => toggleEditMode(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      toggleEditMode(item.id);
                    }
                  }}
                  className="text-sm font-medium bg-white/90 text-black border-none h-6 px-1"
                  autoFocus
                />
              ) : (
                <span
                  className="font-medium text-sm truncate text-black"
                  onClick={() => toggleEditMode(item.id)}
                >
                  {item.title}
                </span>
              )}
              <button
                onClick={() => toggleEditMode(item.id)}
                className={`flex-shrink-0 p-1 rounded hover:bg-black/20 text-black`}
              >
                <Edit className="h-3 w-3" />
              </button>
              <div className="flex gap-1 ml-2 relative">
                {editingGenres === item.id ? (
                  <Select
                    value={item.genre}
                    onValueChange={(newGenre) => updateGenre(item.id, newGenre)}
                  >
                    <SelectTrigger className="w-[120px] h-6 text-xs bg-control-surface border-border">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGenres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative group">
                    <span
                      className={`text-xs px-1 py-0.5 rounded cursor-pointer bg-black/10 text-black`}
                    >
                      {item.genre}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => toggleGenreEdit(item.id)}
                  className={`text-xs px-1 py-0.5 rounded hover:bg-black/40 text-black`}
                >
                  <Edit className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showStatus && (
                <>
                  <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                  {item.status === "live" && (
                    <div className="w-2 h-2 bg-pcr-live-glow rounded-full animate-pulse-live"></div>
                  )}
                </>
              )}
              <button
                onClick={() =>
                  openProgramSettings({
                    ...item,
                    type: activeTabId === "master-epg" ? "VOD" : item.type,
                  })
                }
                className="p-1 rounded hover:bg-black/20 text-black"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
              {(() => {
                const contentInfo = getProgramContentInfo(item);
                return (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Playlist: {item.playlist || "Default Playlist"} - {contentInfo.playlistVideos} videos
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Custom Content: {contentInfo.customVideos} Videos
                    </div>
                    
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddBlockDialog = ({
    type,
    onAdd,
    existingPrograms,
    programToEdit,
    onCancel,
  }: {
    type: "VOD" | "Event";
    onAdd: (item: EPGPreviewItem) => void;
    existingPrograms: EPGPreviewItem[];
    programToEdit: EPGPreviewItem | null;
    onCancel: () => void;
  }) => {
    const [isOpen, setIsOpen] = useState(!!programToEdit);
    const [startTime, setStartTime] = useState(
      programToEdit?.time.split("T")[1] || ""
    );
    const [endTime, setEndTime] = useState("");
    const [title, setTitle] = useState(programToEdit?.title || "");
    const [genre, setGenre] = useState(programToEdit?.genre || "");
    const [playlist, setPlaylist] = useState(
      programToEdit?.playlist || "Default Playlist"
    );
    const [description, setDescription] = useState(
      programToEdit?.description || ""
    );
    const [studioId, setStudioId] = useState(""); // Assuming studioId is not part of EPGPreviewItem yet
    const [image, setImage] = useState<string | null>(
      programToEdit?.imageUrl || "/toi_global_poster.png"
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Calculate duration from start and end time
    const calculateDuration = () => {
      if (!startTime || !endTime) return 0;
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      return endMinutes - startMinutes;
    };

    const duration = calculateDuration();

    // Generate end time options with 15-minute intervals
    const generateEndTimeOptions = () => {
      if (!startTime) return [];

      const options = [];
      const startMinutes = timeToMinutes(startTime);

      // Generate options for next 8 hours (480 minutes) in 15-minute intervals
      for (let i = 15; i <= 480; i += 15) {
        const endMinutes = startMinutes + i;
        const endTimeStr = minutesToTime(endMinutes);
        const endTimeAMPM = minutesToTimeAMPM(endMinutes);
        const durationMinutes = i;

        // Format duration for display
        let durationText = "";
        if (durationMinutes < 60) {
          durationText = `(${durationMinutes} mins)`;
        } else if (durationMinutes === 60) {
          durationText = "(1 hr)";
        } else {
          const hours = Math.floor(durationMinutes / 60);
          const mins = durationMinutes % 60;
          durationText =
            mins > 0 ? `(${hours} hr ${mins} mins)` : `(${hours} hrs)`;
        }

        options.push({
          value: endTimeStr,
          label: `${endTimeAMPM} ${durationText}`,
        });
      }

      return options;
    };

    const endTimeOptions = generateEndTimeOptions();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target?.result as string);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    };

    useEffect(() => {
      if (!programToEdit) {
        let newStartTime = "00:00";
        if (existingPrograms.length > 0) {
          const lastProgramEndMinutes = existingPrograms.reduce(
            (maxEndTime, program) => {
              const programEnd =
                timeToMinutes(program.time.split("T")[1]) + program.duration;
              return Math.max(maxEndTime, programEnd);
            },
            0
          );
          newStartTime = minutesToTime(lastProgramEndMinutes);
        }
        setStartTime(newStartTime);
        // Set initial end time to 1 hour after start time
        const initialStartMinutes = timeToMinutes(newStartTime);
        setEndTime(minutesToTime(initialStartMinutes + 60));
      } else {
        // For editing, set end time based on program duration
        const startMinutes = timeToMinutes(programToEdit.time.split("T")[1]);
        setEndTime(minutesToTime(startMinutes + programToEdit.duration));
      }
    }, [programToEdit, existingPrograms]);

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartTime = e.target.value;
      setStartTime(newStartTime);
      validateField("startTime", newStartTime);
    };

    const validateField = (name: string, value: string) => {
      let error = "";
      if (!value && name !== "endTime") {
        error = "This field is required";
      }
      if (name === "endTime") {
        if (!value) {
          error = "End time is required";
        } else if (duration < 15) {
          error = "Minimum duration is 15 minutes";
        } else if (duration > 480) {
          error = "Maximum duration is 8 hours";
        }
      }
      setErrors((prev) => ({ ...prev, [name]: error }));
      return !error;
    };

    const validateSchedule = useCallback(() => {
      if (!startTime) return true;

      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + duration;

      const conflict = existingPrograms.some((program) => {
        const programStart = timeToMinutes(program.time.split("T")[1]);
        const programEnd = programStart + program.duration;
        return startMinutes < programEnd && endMinutes > programStart;
      });

      if (conflict) {
        setErrors((prev) => ({
          ...prev,
          time: "Time slot overlaps with another scheduled program",
        }));
        return false;
      } else {
        setErrors((prev) => ({ ...prev, time: "" }));
        return true;
      }
    }, [startTime, duration, existingPrograms]);

    useEffect(() => {
      validateSchedule();
    }, [startTime, duration, existingPrograms, validateSchedule]);

    const handleAdd = () => {
      const isStartTimeValid = validateField("startTime", startTime);
      const isEndTimeValid = validateField("endTime", endTime);
      const isTitleValid = validateField("title", title);
      const isGenreValid = validateField("genre", genre);
      const isStudioIdValid =
        type === "Event" ? validateField("studioId", studioId) : true;

      if (
        isStartTimeValid &&
        isEndTimeValid &&
        isTitleValid &&
        isGenreValid &&
        isStudioIdValid &&
        validateSchedule()
      ) {
        const newItem: EPGPreviewItem = {
          ...programToEdit,
          id: programToEdit ? programToEdit.id : `new-${Date.now()}`,
          time: `${
            programToEdit
              ? programToEdit.time.split("T")[0]
              : new Date().toISOString().split("T")[0]
          }T${startTime}`,
          title,
          type: type,
          duration: duration,
          geoZone: "Global",
          description,
          status: "scheduled",
          genre,
          playlist,
          isEditing: false,
          imageUrl: image || "/toi_global_poster.png",
        };
        onAdd(newItem);
        if (programToEdit) {
          onCancel();
        } else {
          setIsOpen(false);
        }
      }
    };

    const isFormValid =
      !Object.values(errors).some((error) => error) &&
      startTime &&
      endTime &&
      title &&
      genre &&
      (type === "VOD" || studioId);

    const DialogComponent = (
      <DialogContent className="bg-card-dark border-border">
        <DialogHeader>
          <DialogTitle>
            {programToEdit
              ? "Edit Program"
              : `Schedule ${type === "VOD" ? "Program" : "Live Program"}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={handleStartTimeChange}
                onBlur={(e) => validateField("startTime", e.target.value)}
                className="bg-control-surface border-border"
              />
              {errors.startTime && (
                <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Select
                value={endTime}
                onValueChange={(value) => {
                  setEndTime(value);
                  validateField("endTime", value);
                }}
              >
                <SelectTrigger className="bg-control-surface border-border">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {endTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endTime && (
                <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>
          {errors.time && (
            <p className="text-red-500 text-xs mt-1">{errors.time}</p>
          )}
          <div>
            <Label htmlFor="title">Program Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                validateField("title", e.target.value);
              }}
              onBlur={(e) => validateField("title", e.target.value)}
              className="bg-control-surface border-border"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          {type === "Event" && (
            <div>
              <Label htmlFor="studioId">Studio ID</Label>
              <Select
                onValueChange={(value) => {
                  setStudioId(value);
                  validateField("studioId", value);
                }}
                value={studioId}
              >
                <SelectTrigger className="bg-control-surface border-border">
                  <SelectValue placeholder="Select Studio ID" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleo 1">Cleo 1</SelectItem>
                  <SelectItem value="Cleo 2">Cleo 2</SelectItem>
                </SelectContent>
              </Select>
              {errors.studioId && (
                <p className="text-red-500 text-xs mt-1">{errors.studioId}</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select
                onValueChange={(value) => {
                  setGenre(value);
                  validateField("genre", value);
                }}
                value={genre}
              >
                <SelectTrigger className="bg-control-surface border-border">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {availableGenres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.genre && (
                <p className="text-red-500 text-xs mt-1">{errors.genre}</p>
              )}
            </div>
            <div>
              <Label htmlFor="playlist">Select Playlist</Label>
              <Select
                onValueChange={(value) => setPlaylist(value)}
                value={playlist}
              >
                <SelectTrigger className="bg-control-surface border-border">
                  <SelectValue placeholder="Select playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default Playlist">
                    Default Playlist
                  </SelectItem>
                  <SelectItem value="Sports Highlights">
                    Sports Highlights
                  </SelectItem>
                  <SelectItem value="Music Mix">Music Mix</SelectItem>
                  <SelectItem value="Tech Reviews">Tech Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-control-surface border-border"
            />
          </div>
          <div>
            <Label>Program Image</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-32 h-18 overflow-hidden rounded-md">
                <img
                  src={image || "/toi_global_poster.png"}
                  alt="Program"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImage("/toi_global_poster.png");
                    setHasUnsavedChanges(true);
                  }}
                >
                  Reset to default
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => (programToEdit ? onCancel() : setIsOpen(false))}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleAdd}
            disabled={!isFormValid}
            className="bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
          >
            {programToEdit ? "Save Changes" : "Add to Schedule"}
          </Button>
        </div>
      </DialogContent>
    );

    if (programToEdit) {
      return DialogComponent;
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant={type === "Event" ? "live" : "playlist"}
            size="sm"
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            {type === "VOD" ? "Program" : "Live Program"}
          </Button>
        </DialogTrigger>
        {DialogComponent}
      </Dialog>
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return new Date(`1970-01-01T${hours}:${minutes}:00`).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  const formatTimeRange = (startTime: string, duration: number) => {
    const startFormatted = formatTime(startTime);
    const endMinutes = timeToMinutes(startTime) + duration;
    const endTime = minutesToTime(endMinutes);
    const endFormatted = formatTime(endTime);
    return `${startFormatted} - ${endFormatted}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-pcr-live text-white";
      case "scheduled":
        return "bg-status-scheduled text-black";
      case "completed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "Event"
      ? "bg-pcr-live text-white"
      : "bg-mcr-playlist text-white";
  };

  const generatePreview = (format: string) => {
    const programs = mockEPGData.map((item) => ({
      "Channel Name": "TOI Global",
      MRP: "0",
      "Schedule Airing Date": item.time.split("T")[0],
      "Airing Start Time": item.time.split("T")[1],
      "End Time": minutesToTime(
        timeToMinutes(item.time.split("T")[1]) + item.duration
      ),
      "Program Duration": item.duration,
      Genre: item.genre,
      "Sub Genre": "",
      "Program Name": item.title,
      "Original/Repeat Live/Recorded":
        item.status === "live" ? "Live" : "Recorded",
      "Broadcast Language": "English",
      "Dubbed Language": "",
      "Episode Number": "",
      "Episode Title": "",
      "Season Number": "",
      "Season Name": "",
      "Star Cast (Comma separated value)": "",
      "Director (Comma separated value)": "",
      "Producer (Comma separated value)": "",
      "Year of Release": new Date().getFullYear(),
      "Censor/Broadcast Ratings": "U/A",
      "Generic Synopsis": item.description,
      "Episodic Synopsis": "",
      "Image URL": item.imageUrl || "",
    }));

    if (format === "json") {
      return JSON.stringify(programs, null, 2);
    } else if (format === "xml") {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<programs>
`;
      programs.forEach((p) => {
        xml += `  <program>
`;
        Object.entries(p).forEach(([key, value]) => {
          const tagName = key.replace(/[^a-zA-Z0-9]/g, "");
          xml += `    <${tagName}>${value}</${tagName}>
`;
        });
        xml += `  </program>
`;
      });
      xml += "</programs>";
      return xml;
    }
    return "";
  };

  const handleQuickXlsDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      mockEPGData.map((item) => ({
        "Channel Name": "TOI Global",
        MRP: "0",
        "Schedule Airing Date": item.time.split("T")[0],
        "Airing Start Time": item.time.split("T")[1],
        "End Time": minutesToTime(
          timeToMinutes(item.time.split("T")[1]) + item.duration
        ),
        "Program Duration": item.duration,
        Genre: item.genre,
        "Sub Genre": "",
        "Program Name": item.title,
        "Original/Repeat Live/Recorded":
          item.status === "live" ? "Live" : "Recorded",
        "Broadcast Language": "English",
        "Dubbed Language": "",
        "Episode Number": "",
        "Episode Title": "",
        "Season Number": "",
        "Season Name": "",
        "Star Cast (Comma separated value)": "",
        "Director (Comma separated value)": "",
        "Producer (Comma separated value)": "",
        "Year of Release": new Date().getFullYear(),
        "Censor/Broadcast Ratings": "U/A",
        "Generic Synopsis": item.description,
        "Episodic Synopsis": "",
        "Image URL": item.imageUrl || "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EPG");
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    XLSX.writeFile(workbook, `epg_preview_${today}.xls`);
    toast({ title: "XLS file downloaded successfully." });
  };

  const handleDownload = (format: "json" | "xml" | "xls") => {
    let data: string | undefined;
    let blobType: string;
    let fileName: string;

    switch (format) {
      case "json":
        data = generatePreview("json");
        blobType = "application/json;charset=utf-8;";
        fileName = "EPG.json";
        break;
      case "xml":
        data = generatePreview("xml");
        blobType = "application/xml;charset=utf-8;";
        fileName = "EPG.xml";
        break;
      case "xls":
        handleQuickXlsDownload();
        return;
    }

    if (data) {
      const blob = new Blob([data], { type: blobType });
      saveAs(blob, fileName);
      toast({ title: `${format.toUpperCase()} file downloaded successfully.` });
    }
  };

  const generateXlsPreview = () => {
    const data = mockEPGData.slice(0, 5).map((item) => ({
      "Channel Name": "TOI Global",
      MRP: "0",
      "Schedule Airing Date": item.time.split("T")[0],
      "Airing Start Time": item.time.split("T")[1],
      "End Time": minutesToTime(
        timeToMinutes(item.time.split("T")[1]) + item.duration
      ),
      "Program Duration": item.duration,
      Genre: item.genre,
      "Sub Genre": "",
      "Program Name": item.title,
      "Original/Repeat Live/Recorded":
        item.status === "live" ? "Live" : "Recorded",
      "Broadcast Language": "English",
      "Dubbed Language": "",
      "Episode Number": "",
      "Episode Title": "",
      "Season Number": "",
      "Season Name": "",
      "Star Cast (Comma separated value)": "",
      "Director (Comma separated value)": "",
      "Producer (Comma separated value)": "",
      "Year of Release": new Date().getFullYear(),
      "Censor/Broadcast Ratings": "U/A",
      "Generic Synopsis": item.description,
      "Episodic Synopsis": "",
      "Image URL": item.imageUrl || "",
    }));

    if (data.length === 0) {
      return <p>No data to display.</p>;
    }

    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-700">
              {headers.map((header) => (
                <th key={header} className="p-1 font-bold text-white">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-600">
                {headers.map((header) => (
                  <td key={header} className="p-1">
                    {row[header as keyof typeof row]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  // removed duplicate handleDateChangeFromCalendar

  const renderCurrentView = () => {
    const dailyPrograms = selectedDayPrograms;

    // Preview Tab - Contains Master EPG, Today's EPG, and Date Selection
    if (activeTabId === "preview") {
      return (
        <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
          <CardContent>
            {/* Sub-navigation for Preview Tab */}
            <div className="mb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 relative">
                  <Button
                    ref={calendarButtonRef}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (calendarButtonRef.current) {
                        const rect = calendarButtonRef.current.getBoundingClientRect();
                        setCalendarPosition({
                          top: rect.bottom + window.scrollY + 4,
                          left: rect.left + window.scrollX
                        });
                      }
                      setIsSelectDateCalendarOpen(!isSelectDateCalendarOpen);
                    }}
                    className="flex items-center gap-2"
                    data-calendar-trigger
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveEpg}
                    disabled={isSaving || !isSaveEpgEnabled()}
                    className="bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar Dropdown for Date Selection */}
            {isSelectDateCalendarOpen && createPortal(
              <div 
                className="fixed z-[9999] p-3 bg-white rounded-lg border border-gray-200 shadow-lg calendar-dropdown w-80" 
                style={{ 
                  pointerEvents: 'auto',
                  top: `${calendarPosition.top}px`,
                  left: `${calendarPosition.left}px`
                }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setIsSelectDateCalendarOpen(false);
                    }
                  }}
                  className="rounded-md border"
                  classNames={{
                    day_selected:
                      "bg-broadcast-blue text-white hover:bg-broadcast-blue hover:text-white",
                    day_today: "bg-slate-600 text-white",
                  }}
                />
              </div>,
              document.body
            )}

            {/* EPG Content */}
            <div className="bg-control-surface rounded-lg p-4">
              {dailyPrograms.length === 0 ? (
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-broadcast-blue/10 rounded-full flex items-center justify-center">
                      <CalendarIcon className="h-8 w-8 text-broadcast-blue" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    No EPG has been created for this date
                  </h3>
                  <p className="text-muted-foreground">
                    Add programs to create the schedule for{" "}
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    .
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyPrograms
                    .filter((i) => i.status === "completed")
                    .map((item) => (
                      <ProgramItem
                        key={`${item.id}-${item.videos?.length || 0}-${item.customContentCount || 0}-${item.customContentDuration || 0}`}
                        item={item}
                        isDraggable={false}
                      />
                    ))}
                  {dailyPrograms.find((i) => i.status === "live") && (
                    <ProgramItem
                      key={`${dailyPrograms.find((i) => i.status === "live")!.id}-${dailyPrograms.find((i) => i.status === "live")!.videos?.length || 0}-${dailyPrograms.find((i) => i.status === "live")!.customContentCount || 0}-${dailyPrograms.find((i) => i.status === "live")!.customContentDuration || 0}`}
                      item={dailyPrograms.find((i) => i.status === "live")!}
                      isDraggable={false}
                    />
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={dailyPrograms
                        .filter((i) => i.status === "scheduled")
                        .map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {dailyPrograms
                        .filter((i) => i.status === "scheduled")
                        .map((item) => (
                          <SortableItem key={`${item.id}-${item.videos?.length || 0}-${item.customContentCount || 0}-${item.customContentDuration || 0}`} id={item.id}>
                            {(listeners) => (
                              <ProgramItem
                                item={item}
                                isDraggable={true}
                                listeners={listeners}
                              />
                            )}
                          </SortableItem>
                        ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Scheduler Tab - Contains EPG Scheduler Component
    if (activeTabId === "scheduler") {
      return (
        <div className="transition-opacity duration-300 animate-fadeIn">
          <EPGScheduler onNavigate={onNavigate} />
        </div>
      );
    }

    // Calendar Tab - Contains Weekly and Monthly Views
    if (activeTabId === "calendar") {
      return (
        <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
          <CardContent>
            {/* Sub-navigation for Calendar Tab */}
            <div className="mb-4 border-b border-gray-200">
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant={viewMode === "weekly" ? "broadcast" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("weekly")}
                >
                  Weekly View
                </Button>
                <Button
                  variant={viewMode === "monthly" ? "broadcast" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("monthly")}
                >
                  Monthly View
                </Button>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="p-6">
              {viewMode === "weekly" ? (
                <WeeklyView
                  programs={mockEPGData}
                  onProgramCopy={(program, newDate) => {
                    const newTime = program.time.split("T")[1];
                    const newProgram = {
                      ...program,
                      id: `copy-${program.id}-${Date.now()}`,
                      time: `${newDate}T${newTime}`,
                    };
                    setMockEPGData((prev) => [...prev, newProgram]);
                    toast({
                      title: `Program copied to ${newDate} successfully`,
                    });
                  }}
                  onProgramEdit={(program) => setEditingProgram(program)}
                  onDateClick={handleDateChangeFromCalendar}
                />
              ) : (
                <MonthlyView
                  programs={mockEPGData}
                  onDateClick={handleDateChangeFromCalendar}
                />
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Main Layout - Full Width Content */}
      <div className="w-full">
        {/* Header, Tab Interface and EPG Content */}
        <div className="w-full">
          <PageHeader
            title={`${
              (typeof window !== "undefined" &&
                localStorage.getItem("activeChannelName")) ||
              "TOI Global"
            } - EPG Management`}
            rightContent={
              <div className="flex items-center gap-2">
                {/* Add Program Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                  onClick={() => setIsCreateProgramModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>

                {/* Export Settings Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExportSettingsModalOpen(true)}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>

                {/* Generate 14 days EPG Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveEpg}
                          disabled={isSaving || !isSaveEpgEnabled()}
                          className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                        >
                          {isSaving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Database className="h-4 w-4 mr-2" />
                          )}
                          Generate 14 days EPG
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isSaveEpgEnabled() && getSaveEpgTooltipMessage() && (
                      <TooltipContent>
                        <p>{getSaveEpgTooltipMessage()}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            fullWidth
          />
          {/* Draft Banner */}
          {isDraftMode && (
            <div className="mb-3 p-3 border border-border bg-yellow-50 text-yellow-800 rounded flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                Add programs for your new channel ‘{draftChannel?.name}’ to
                complete setup.
              </div>
            </div>
          )}
          {/* Tab Interface */}
          <div className="mb-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    data-tab-id={tab.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-colors ${
                      activeTabId === tab.id
                        ? "bg-broadcast-blue text-white"
                        : "bg-white text-black hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <span className="text-sm font-medium">{tab.label}</span>
                    {tab.id === "select-date" && (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EPG Content - Fixed Height and Scrollable */}
          <div className="h-[calc(100vh-100px)] overflow-y-auto">
            {renderCurrentView()}
          </div>
        </div>
      </div>

      {/* Export Settings Modal */}
      <Dialog
        open={isExportSettingsModalOpen}
        onOpenChange={setIsExportSettingsModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="format">Output Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xmltv">XMLTV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="distributor">Distributor</Label>
              <Select value={distributor} onValueChange={setDistributor}>
                <SelectTrigger className="bg-control-surface border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gracenote">Gracenote</SelectItem>
                  <SelectItem value="Amagi">Amagi</SelectItem>
                  <SelectItem value="Samsung">Samsung</SelectItem>
                  <SelectItem value="Xiaomi">Xiaomi</SelectItem>
                  <SelectItem value="LG">LG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
              <Label htmlFor="metadata">Include Metadata</Label>
            </div>

            <div className="space-y-2">
              <Button variant="broadcast" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export EPG Data
              </Button>
              <Button
                variant="control"
                className="w-full"
                onClick={() => {
                  setIsExportSettingsModalOpen(false);
                  setIsPreviewModalOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview EPG
              </Button>
              <Button
                variant="control"
                className="w-full"
                onClick={() => {
                  toast({ title: "EPG FTP updated successfully" });
                  setIsExportSettingsModalOpen(false);
                }}
              >
                Export to FTP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isPreviewModalOpen && (
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="max-w-[80vw] max-h-[85vh] h-full flex flex-col">
            <DialogHeader>
              <DialogTitle>EPG Preview</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              <Tabs defaultValue="json" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="json"
                    className="bg-white text-black data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
                  >
                    JSON
                  </TabsTrigger>
                  <TabsTrigger
                    value="xml"
                    className="bg-white text-black data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
                  >
                    XML
                  </TabsTrigger>
                  <TabsTrigger
                    value="xls"
                    className="bg-white text-black data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
                  >
                    XLS
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="json" className="flex-grow overflow-auto">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre">
                      {generatePreview("json")}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="xml" className="flex-grow overflow-auto">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre">
                      {generatePreview("xml")}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="xls" className="flex-grow overflow-auto">
                  {generateXlsPreview()}
                </TabsContent>
              </Tabs>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={() => handleDownload("json")}>
                Download JSON
              </Button>
              <Button variant="outline" onClick={() => handleDownload("xml")}>
                Download XML
              </Button>
              <Button variant="outline" onClick={() => handleDownload("xls")}>
                Download XLS
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Program Settings Modal */}
      <ProgramSettingsModal
        isOpen={isProgramSettingsOpen}
        onClose={closeProgramSettings}
        onSave={saveProgramSettings}
        program={selectedProgram}
        hasUnsavedChanges={hasProgramChanges}
        onUnsavedClose={handleUnsavedClose}
      />
      {/* Create Program Modal */}
      <CreateProgramModal
        isOpen={isCreateProgramModalOpen}
        onClose={() => setIsCreateProgramModalOpen(false)}
        onSave={handleCreateProgram}
        existingPrograms={mockEPGData}
        channelDate={new Date()}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <DialogContent className="bg-card-dark border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Discard Unsaved Changes?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              You have unsaved changes to the program settings. Are you sure you want to discard them?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={cancelDiscard}
              className="text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDiscard}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Discard Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ManageAdsModal
        isOpen={isManageAdsModalOpen}
        onClose={() => setIsManageAdsModalOpen(false)}
        onSave={handleAdSave}
      />
      <RepeatScheduleModal
        isOpen={isRepeatModalOpen}
        onClose={() => setIsRepeatModalOpen(false)}
        onSave={handleRepeatSave}
      />
      <Toaster />
    </div>
  );
};
