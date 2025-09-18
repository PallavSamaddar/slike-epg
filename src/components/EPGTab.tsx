import { FC, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { createPortal } from 'react-dom';
import EpgXlsTable from './epg/EpgXlsTable';
import WeeklyViewList from './calendar/WeeklyViewList';
import MonthlyViewList from './calendar/MonthlyViewList';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface EPGPreviewItem {
  id: string;
  time: string;
  title: string;
  type: 'VOD' | 'Event';
  duration: number;
  geoZone: string;
  description?: string;
  status: 'live' | 'scheduled' | 'completed';
  genre: string;
  playlist?: string;
  imageUrl?: string;
}

interface EPGTabProps {
  programs: EPGPreviewItem[];
  onProgramCopy?: (program: EPGPreviewItem, newDate: string) => void;
  onProgramEdit?: (program: EPGPreviewItem) => void;
  onDateClick?: (date: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  activeSubTab: string;
  onSubTabChange: (subTab: string) => void;
}

const EPGTab: FC<EPGTabProps> = ({
  programs,
  onProgramCopy,
  onProgramEdit,
  onDateClick,
  selectedDate,
  onDateChange,
  activeSubTab,
  onSubTabChange
}) => {
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

  // Helper functions for time conversion
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Get today's date in IST
  const getTodayIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(now.getTime() + istOffset);
  };

  // Handle calendar position updates
  useEffect(() => {
    const updatePosition = () => {
      if (isCalendarOpen) {
        const button = document.querySelector('[data-calendar-trigger]');
        if (button) {
          const rect = button.getBoundingClientRect();
          setCalendarPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX
          });
        }
      }
    };

    if (isCalendarOpen) {
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isCalendarOpen]);

  // Handle click outside calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCalendarOpen) {
        const target = event.target as HTMLElement;
        if (
          !target.closest('.calendar-dropdown') &&
          !target.closest('[data-calendar-trigger]')
        ) {
          setIsCalendarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const handleCalendarClick = () => {
    const button = document.querySelector('[data-calendar-trigger]');
    if (button) {
      const rect = button.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsCalendarOpen(false);
    }
  };

  const handleProgramCopyWrapper = (program: EPGPreviewItem, newDate: string) => {
    if (onProgramCopy) {
      onProgramCopy(program, newDate);
    } else {
      toast({
        title: `Program copied to ${newDate} successfully`,
      });
    }
  };

  const handleDateClickWrapper = (date: string) => {
    if (onDateClick) {
      onDateClick(date);
    } else {
      // Default behavior: parse date and update selected date
      const [y, m, d] = date.split('-').map(Number);
      const newDate = new Date(y, m - 1, d);
      onDateChange(newDate);
      onSubTabChange('daily');
    }
  };

  return (
    <Card className="bg-card-dark border-border transition-opacity duration-300 animate-fadeIn">
      <CardContent className="p-6">
        <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-200">
            <TabsTrigger
              value="daily"
              className="text-gray-700 data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
            >
              Daily
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="text-gray-700 data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
            >
              Weekly
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="text-gray-700 data-[state=active]:bg-broadcast-blue data-[state=active]:text-white"
            >
              Monthly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-6">
            {/* Daily Tab Header - Calendar and Download CTAs in same row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalendarClick}
                  className="flex items-center gap-2 shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                  data-calendar-trigger
                  aria-label="Select date"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Button>
              </div>
              
              {/* Download CTAs */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const data = programs.filter(p => p.time.startsWith(selectedDate.toISOString().split('T')[0])).map((item) => ({
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
                    const worksheet = XLSX.utils.json_to_sheet(data);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "EPG");
                    const dateStr = selectedDate.toISOString().split("T")[0].replace(/-/g, "");
                    XLSX.writeFile(workbook, `epg_${dateStr}.xls`);
                    toast({ title: "XLS file downloaded successfully." });
                  }}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                  aria-label="Download EPG as XLS"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download XLS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const data = programs.filter(p => p.time.startsWith(selectedDate.toISOString().split('T')[0])).map((item) => ({
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
                    const blob = new Blob([JSON.stringify(data, null, 2)], { 
                      type: "application/json;charset=utf-8;" 
                    });
                    const dateStr = selectedDate.toISOString().split("T")[0].replace(/-/g, "");
                    saveAs(blob, `epg_${dateStr}.json`);
                    toast({ title: "JSON file downloaded successfully." });
                  }}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                  aria-label="Download EPG as JSON"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const data = programs.filter(p => p.time.startsWith(selectedDate.toISOString().split('T')[0])).map((item) => ({
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
                    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<programs>
`;
                    data.forEach((p) => {
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
                    
                    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
                    const dateStr = selectedDate.toISOString().split("T")[0].replace(/-/g, "");
                    saveAs(blob, `epg_${dateStr}.xml`);
                    toast({ title: "XML file downloaded successfully." });
                  }}
                  className="shrink-0 bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700"
                  aria-label="Download EPG as XML"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download XML
                </Button>
              </div>
            </div>

            {/* Calendar Dropdown */}
            {isCalendarOpen && createPortal(
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
                  onSelect={handleDateSelect}
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

            {/* XLS Table */}
            <EpgXlsTable
              channelId="toi-global"
              date={selectedDate}
              timezone="Asia/Kolkata"
              programs={programs}
            />
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <WeeklyViewList
              programs={programs}
              onProgramCopy={handleProgramCopyWrapper}
              onProgramEdit={onProgramEdit || (() => {})}
              onDateClick={handleDateClickWrapper}
            />
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <MonthlyViewList
              programs={programs}
              onDateClick={handleDateClickWrapper}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EPGTab;
