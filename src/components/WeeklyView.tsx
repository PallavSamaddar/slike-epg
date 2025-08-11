import { FC } from "react";
import { DndContext, useDroppable, useDraggable } from '@dnd-kit/core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GripVertical } from 'lucide-react';

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

const DraggableProgram: FC<{ program: any, onEditClick: (program: any) => void }> = ({ program }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: program.id,
        data: { program },
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        ref={setNodeRef}
                        style={style}
                        className={`group relative p-1 m-1 rounded text-white text-xs ${genreColors[program.genre] || genreColors.Default} flex items-center gap-1 cursor-pointer`}
                    >
                        <span {...listeners} {...attributes} className="cursor-grab touch-none p-1">
                            <GripVertical className="h-4 w-4" />
                        </span>
                        <span>
                            {program.time.split('T')[1]} {program.title}
                        </span>
                        {/* Hover edit removed */}
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
};

const DroppableCell: FC<{ date: string, programs: any[], onEditClick: (program: any) => void, onDateClick: (date: string) => void, children?: React.ReactNode }> = ({ date, programs, onEditClick, onDateClick, children }) => {
    const { setNodeRef } = useDroppable({ id: date });

    return (
        <div ref={setNodeRef} className="h-full border p-1 cursor-pointer" onClick={() => onDateClick(date)}>
            {children}
            {programs.map(p => <DraggableProgram key={p.id} program={p} onEditClick={onEditClick} />)}
        </div>
    );
};

const WeeklyView: FC<{ programs: any[], onProgramCopy: (program: any, newDate: string) => void, onProgramEdit: (program: any) => void, onDateClick: (date: string) => void }> = ({ programs, onProgramCopy, onProgramEdit, onDateClick }) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const times = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const today = new Date();
    const currentDay = today.getDay();

    const handleDrop = (event: any) => {
        const { over, active } = event;
        if (over && active) {
            const program = active.data.current.program;
            const newDate = over.id;
            const originalDate = program.time.split('T')[0];
            if (newDate !== originalDate) {
                onProgramCopy(program, newDate);
            }
        }
    };

    return (
        <DndContext onDragEnd={handleDrop}>
            <div className="flex flex-col">
                <div className="flex">
                    <div className="w-16" />
                    {days.map((day, index) => {
                        const date = new Date(today);
                        date.setDate(today.getDate() - currentDay + index);
                        return (
                            <div key={day} className="flex-1 text-center font-bold">
                                {day} <span className="font-normal text-sm">{date.getDate()}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex" style={{ height: '60vh', overflowY: 'auto' }}>
                    <div className="w-16">
                        {times.map(time => (
                            <div key={time} className="h-12 flex items-center justify-center text-xs">{time}</div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7">
                        {days.map((_day, index) => {
                            const date = new Date(today);
                            date.setDate(today.getDate() - currentDay + index);
                            const dateString = date.toISOString().split('T')[0];
                            const dayPrograms = programs.filter(p => p.time.startsWith(dateString));
                            return <DroppableCell key={dateString} date={dateString} programs={dayPrograms} onEditClick={onProgramEdit} onDateClick={onDateClick} />;
                        })}
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default WeeklyView;
