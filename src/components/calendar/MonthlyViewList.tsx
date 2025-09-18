import { FC } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface MonthlyViewListProps {
  programs: EPGPreviewItem[];
  onDateClick: (date: string) => void;
}

const genreColors: { [key: string]: string } = {
    News: 'bg-blue-500',
    Sports: 'bg-green-500',
    Entertainment: 'bg-purple-500',
    Business: 'bg-orange-500',
    Movies: 'bg-red-500',
    'Talk Show': 'bg-yellow-500',
    Games: 'bg-indigo-500',
    Cooking: 'bg-pink-500',
    Music: 'bg-teal-500',
    Comedy: 'bg-cyan-500',
    Default: 'bg-gray-500',
};

const ProgramTag: FC<{ program: EPGPreviewItem }> = ({ program }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger>
                <div className={`p-1 m-px rounded text-white text-xs ${genreColors[program.genre] || genreColors.Default}`}>
                    {program.time.split('T')[1]} {program.title.substring(0, 10)}...
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{program.title}</p>
                <p>
                    {new Date(program.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(new Date(program.time).getTime() + program.duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p>Genre: {program.genre}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const MonthlyViewList: FC<MonthlyViewListProps> = ({ programs, onDateClick }) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Use IST timezone for date calculations
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istToday = new Date(today.getTime() + istOffset);
    
    const year = istToday.getFullYear();
    const month = istToday.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-7">
                {days.map(day => (
                    <div key={day} className="text-center font-bold p-2">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7" style={{ height: '70vh' }}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                    const d = new Date(year, month, i + 1);
                    const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    return (
                        <div key={`empty-${i}`} className="h-full border cursor-pointer" onClick={() => onDateClick(localStr)} />
                    );
                })}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const date = new Date(year, month, i + 1);
                    const dateString = date.toISOString().split('T')[0];
                    const localString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                    const dayPrograms = programs.filter(p => p.time.startsWith(dateString));

                    return (
                        <div key={dateString} className="h-full border p-1 overflow-auto cursor-pointer" onClick={() => onDateClick(localString)}>
                            <div className="font-bold mb-1">{i + 1}</div>
                            {dayPrograms.map(p => <ProgramTag key={p.id} program={p} />)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthlyViewList;
