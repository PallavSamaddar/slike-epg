import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RepeatScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string, selectedDays: number[]) => void;
}

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const RepeatScheduleModal = ({ isOpen, onClose, onSave }: RepeatScheduleModalProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');

  const handleDayClick = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSave = () => {
    if (!startDate || !endDate) {
      setError('Please select a start and end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Please select at least one day of the week.');
      return;
    }
    setError('');
    onSave(startDate, endDate, selectedDays);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card-dark border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Copy EPG</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-control-surface border-border" />
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-control-surface border-border" />
            </div>
          </div>
          <div>
            <Label>Repeat on</Label>
            <div className="flex justify-between mt-2">
              {weekdays.map((day, index) => (
                <button 
                  key={index}
                  onClick={() => handleDayClick(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                    ${selectedDays.includes(index) ? 'bg-primary text-white' : 'bg-control-surface text-foreground'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <p className="text-xs text-muted-foreground">
            The current EPG schedule and ad configuration will be copied to selected weekdays within the date range.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>CANCEL</Button>
          <Button onClick={handleSave}>COPY EPG</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 