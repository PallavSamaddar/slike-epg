import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Clock, 
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (program: any) => void;
  existingPrograms: any[];
  channelDate: Date;
}

interface FormData {
  title: string;
  playlistId: string;
  description: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  // Advanced options
  ageRestricted: boolean;
  geoRestricted: boolean;
  geoRegions: string[];
  timeSensitive: boolean;
  expiryDate: string;
  expiryTime: string;
  rating: string;
  language: string[];
}

const CATEGORIES = [
  { id: 'news', label: 'News' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'movies', label: 'Movies' },
  { id: 'music', label: 'Music' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'kids', label: 'Kids' },
  { id: 'education', label: 'Education' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'comedy', label: 'Comedy' }
];

const RATINGS = [
  { value: 'U', label: 'U' },
  { value: 'UA7', label: 'UA7+' },
  { value: 'UA13', label: 'UA13+' },
  { value: 'UA16', label: 'UA16+' },
  { value: 'A', label: 'A' }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'bn', label: 'Bengali' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mr', label: 'Marathi' },
  { value: 'pa', label: 'Punjabi' }
];


const PLAYLISTS = [
  { id: 'default', name: 'Default Playlist', targetDuration: 60 },
  { id: 'sports', name: 'Sports Highlights', targetDuration: 120 },
  { id: 'music', name: 'Music Mix', targetDuration: 90 },
  { id: 'tech', name: 'Tech Reviews', targetDuration: 45 }
];

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPrograms,
  channelDate
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    playlistId: 'default',
    description: '',
    categoryId: '',
    startTime: '00:00',
    endTime: '02:00',
    ageRestricted: false,
    geoRestricted: false,
    geoRegions: [],
    timeSensitive: false,
    expiryDate: '',
    expiryTime: '',
    rating: '',
    language: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastUsedPlaylist, setLastUsedPlaylist] = useState('default');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus on title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Find next available time slot
  const findNextAvailableSlot = useCallback((durationMinutes: number = 120) => {
    const channelDateStr = channelDate.toISOString().split('T')[0];
    
    // Filter programs for the current channel date
    const todayPrograms = existingPrograms.filter(program => {
      const programDate = new Date(program.time).toISOString().split('T')[0];
      return programDate === channelDateStr;
    });
    
    // Sort existing programs by start time
    const sortedPrograms = [...todayPrograms].sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeA - timeB;
    });

    // Check for gaps between programs
    for (let i = 0; i < sortedPrograms.length - 1; i++) {
      const currentProgram = sortedPrograms[i];
      const nextProgram = sortedPrograms[i + 1];
      
      const currentEnd = new Date(new Date(currentProgram.time).getTime() + currentProgram.duration * 60000);
      const nextStart = new Date(nextProgram.time);
      
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gapMinutes >= durationMinutes) {
        // Found a gap that can fit our duration
        const startTime = currentEnd;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        
        return {
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5)
        };
      }
    }

    // If no gap found, try after the last program
    if (sortedPrograms.length > 0) {
      const lastProgram = sortedPrograms[sortedPrograms.length - 1];
      const lastEnd = new Date(new Date(lastProgram.time).getTime() + lastProgram.duration * 60000);
      const startTime = lastEnd;
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      // Check if it doesn't go past midnight (24:00)
      const midnight = new Date(`${channelDateStr}T23:59:59`);
      if (endTime <= new Date(midnight.getTime() + 60000)) { // Allow up to 00:00 next day
        return {
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5)
        };
      }
    }

    // Default fallback: start at 00:00 if no programs exist or no suitable gap
    return {
      startTime: '00:00',
      endTime: '02:00'
    };
  }, [existingPrograms, channelDate]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const availableSlot = findNextAvailableSlot(120); // 2 hours = 120 minutes
      
      setFormData({
        title: '',
        playlistId: lastUsedPlaylist,
        description: '',
        categoryId: '',
        startTime: availableSlot.startTime,
        endTime: availableSlot.endTime,
        ageRestricted: false,
        geoRestricted: false,
        geoRegions: [],
        timeSensitive: false,
        expiryDate: '',
        expiryTime: '',
        rating: '',
        language: []
      });
      setErrors({});
      setIsDirty(false);
      setIsAdvancedOpen(false);
    }
  }, [isOpen, lastUsedPlaylist, findNextAvailableSlot]);

  // Track form changes
  const handleFormChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Time validation and overlap detection
  const validateTimeOverlap = useCallback((startTime: string, endTime: string) => {
    const channelDateStr = channelDate.toISOString().split('T')[0];
    const newStart = new Date(`${channelDateStr}T${startTime}:00`);
    const newEnd = new Date(`${channelDateStr}T${endTime}:00`);
    
    // Handle midnight crossing
    if (newEnd <= newStart) {
      newEnd.setDate(newEnd.getDate() + 1);
    }

    for (const program of existingPrograms) {
      const programStart = new Date(program.time);
      const programEnd = new Date(programStart.getTime() + program.duration * 60000);
      
      // Check for overlap using half-open intervals: (A_start < B_end) && (A_end > B_start)
      if (newStart < programEnd && newEnd > programStart) {
        return {
          hasOverlap: true,
          conflictingProgram: program
        };
      }
    }
    
    return { hasOverlap: false, conflictingProgram: null };
  }, [existingPrograms, channelDate]);

  // Calculate duration
  const duration = useMemo(() => {
    const start = new Date(`2000-01-01T${formData.startTime}:00`);
    const end = new Date(`2000-01-01T${formData.endTime}:00`);
    
    if (end <= start) {
      end.setDate(end.getDate() + 1); // Next day
    }
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, totalMinutes: Math.floor(diffMs / (1000 * 60)) };
  }, [formData.startTime, formData.endTime]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Program title is required';
    } else if (formData.title.length > 120) {
      newErrors.title = 'Title must be 120 characters or less';
    }

    if (!formData.playlistId) {
      newErrors.playlistId = 'Playlist is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Time validation
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}:00`);
      const end = new Date(`2000-01-01T${formData.endTime}:00`);
      
      if (end <= start && formData.startTime !== formData.endTime) {
        // This is OK - it means it spans midnight
      } else if (formData.startTime === formData.endTime) {
        newErrors.endTime = 'End time must be different from start time';
      }
    }

    // Overlap validation
    if (formData.startTime && formData.endTime) {
      const overlapCheck = validateTimeOverlap(formData.startTime, formData.endTime);
      if (overlapCheck.hasOverlap) {
        const conflict = overlapCheck.conflictingProgram;
        const conflictStart = new Date(conflict.time).toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const conflictEnd = new Date(new Date(conflict.time).getTime() + conflict.duration * 60000)
          .toLocaleTimeString('en-IN', { 
            timeZone: 'Asia/Kolkata', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        
        newErrors.startTime = `This time overlaps with "${conflict.title}" (${conflictStart}–${conflictEnd})`;
        newErrors.endTime = `This time overlaps with "${conflict.title}" (${conflictStart}–${conflictEnd})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateTimeOverlap]);

  // Handle time input with 5-minute increments
  const handleTimeChange = useCallback((field: 'startTime' | 'endTime', value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 5) * 5;
    const adjustedHours = roundedMinutes >= 60 ? hours + 1 : hours;
    const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;
    
    const formattedTime = `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    handleFormChange(field, formattedTime);
  }, [handleFormChange]);

  // Handle keyboard navigation for time inputs
  const handleTimeKeyDown = useCallback((e: React.KeyboardEvent, field: 'startTime' | 'endTime') => {
    const [hours, minutes] = formData[field].split(':').map(Number);
    let newMinutes = minutes;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newMinutes = e.shiftKey ? minutes + 30 : minutes + 5;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newMinutes = e.shiftKey ? minutes - 30 : minutes - 5;
    } else if (e.key === 'Enter' && field === 'endTime') {
      e.preventDefault();
      // Focus will move to the Create Program button, user can press Enter again to submit
      const createButton = document.querySelector('[data-testid="create-program-button"]') as HTMLButtonElement;
      if (createButton) {
        createButton.focus();
      }
    } else {
      return;
    }
    
    // Normalize minutes
    const adjustedHours = hours + Math.floor(newMinutes / 60);
    const finalMinutes = ((newMinutes % 60) + 60) % 60;
    const finalHours = ((adjustedHours % 24) + 24) % 24;
    
    const formattedTime = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
    handleFormChange(field, formattedTime);
  }, [formData, handleFormChange]);


  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    const channelDateStr = channelDate.toISOString().split('T')[0];
    const startDateTime = new Date(`${channelDateStr}T${formData.startTime}:00`);
    const endDateTime = new Date(`${channelDateStr}T${formData.endTime}:00`);
    
    // Handle midnight crossing
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const program = {
      id: `new-${Date.now()}`,
      time: startDateTime.toISOString(),
      title: formData.title,
      type: 'VOD',
      duration: duration.totalMinutes,
      geoZone: 'Global',
      description: formData.description,
      status: 'scheduled',
      genre: formData.categoryId || 'Entertainment',
      playlist: PLAYLISTS.find(p => p.id === formData.playlistId)?.name || 'Default Playlist',
      imageUrl: '/toi_global_poster.png',
      // Advanced fields
      restrictions: {
        ageRestricted: formData.ageRestricted,
        geo: formData.geoRestricted ? formData.geoRegions : [],
        timeSensitive: formData.timeSensitive ? {
          expiresAt: formData.expiryDate && formData.expiryTime 
            ? new Date(`${formData.expiryDate}T${formData.expiryTime}:00`).toISOString()
            : null
        } : null
      },
      rating: formData.rating || undefined,
      language: formData.language,
      categoryId: formData.categoryId
    };

    // Save the playlist for next use
    setLastUsedPlaylist(formData.playlistId);

    onSave(program);
    
    toast({
      title: 'Program created',
      description: 'The program has been added to the schedule.',
    });
  }, [formData, validateForm, duration, channelDate, onSave, toast]);

  // Handle close with dirty check
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleSubmit]);

  const isFormValid = formData.title.trim() && 
                     formData.playlistId && 
                     formData.startTime && 
                     formData.endTime && 
                     Object.keys(errors).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[800px] max-w-[920px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Program</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
          <div className="flex-1 overflow-y-auto space-y-5 pl-6 pr-2">
            {/* Row 1: Program Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-semibold">Program Title *</Label>
              <Input
                ref={titleInputRef}
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="e.g., Midnight Movies"
                className={`mt-1 border-gray-300 ${errors.title ? 'border-red-500' : ''}`}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-red-500 text-xs mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Row 2: Playlist and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="playlist" className="text-sm font-semibold">Playlist *</Label>
                <Select
                  value={formData.playlistId}
                  onValueChange={(value) => handleFormChange('playlistId', value)}
                >
                  <SelectTrigger className={`mt-1 border-gray-300 ${errors.playlistId ? 'border-red-500' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYLISTS.map(playlist => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.playlistId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.playlistId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleFormChange('categoryId', value)}
                >
                  <SelectTrigger className="mt-1 border-gray-300">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Start Time and End Time */}
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-sm font-semibold">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    onKeyDown={(e) => handleTimeKeyDown(e, 'startTime')}
                    className={`mt-1 border-gray-300 ${errors.startTime ? 'border-red-500' : ''}`}
                    aria-describedby={errors.startTime ? 'startTime-error' : undefined}
                  />
                  <p className="text-xs text-gray-600 mt-1">All times in IST</p>
                  {errors.startTime && (
                    <p id="startTime-error" className="text-red-500 text-xs mt-1">
                      {errors.startTime}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-sm font-semibold">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    onKeyDown={(e) => handleTimeKeyDown(e, 'endTime')}
                    className={`mt-1 border-gray-300 ${errors.endTime ? 'border-red-500' : ''}`}
                    aria-describedby={errors.endTime ? 'endTime-error' : undefined}
                  />
                  <p className="text-xs text-gray-600 mt-1">All times in IST</p>
                  {errors.endTime && (
                    <p id="endTime-error" className="text-red-500 text-xs mt-1">
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {duration.hours}h {duration.minutes}m</span>
                  {(() => {
                    const selectedPlaylist = PLAYLISTS.find(p => p.id === formData.playlistId);
                    return selectedPlaylist && (
                      <span className="text-gray-500 text-xs">
                        (Playlist target: {selectedPlaylist.targetDuration}m)
                      </span>
                    );
                  })()}
                </div>
                {duration.totalMinutes > 0 && duration.totalMinutes < 60 && (
                  <Badge variant="outline" className="text-xs">
                    spans midnight
                  </Badge>
                )}
              </div>
            </div>

            {/* Row 4: Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Enter program description..."
                rows={4}
                className="mt-1 border-gray-300"
              />
            </div>

            {/* Row 5: Advanced Options */}
            <Accordion 
              type="single" 
              collapsible 
              value={isAdvancedOpen ? "advanced" : ""}
              onValueChange={(value) => setIsAdvancedOpen(value === "advanced")}
            >
              <AccordionItem value="advanced">
                <AccordionTrigger className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4" />
                    Advanced Options
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {/* Content Restrictions */}
                  <div>
                    <Label className="text-sm font-semibold">Content Restrictions</Label>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ageRestricted"
                          checked={formData.ageRestricted}
                          onCheckedChange={(checked) => handleFormChange('ageRestricted', checked)}
                        />
                        <Label htmlFor="ageRestricted" className="text-sm">Age Restricted Content</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="geoRestricted"
                          checked={formData.geoRestricted}
                          onCheckedChange={(checked) => handleFormChange('geoRestricted', checked)}
                        />
                        <Label htmlFor="geoRestricted" className="text-sm">Geographic Restrictions</Label>
                      </div>
                      
                      {formData.geoRestricted && (
                        <div className="ml-6">
                          <Label className="text-sm">Region</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {['US', 'EU', 'APAC', 'India'].map(region => (
                              <div key={region} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`region-${region}`}
                                  checked={formData.geoRegions.includes(region)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleFormChange('geoRegions', [...formData.geoRegions, region]);
                                    } else {
                                      handleFormChange('geoRegions', formData.geoRegions.filter(r => r !== region));
                                    }
                                  }}
                                />
                                <Label htmlFor={`region-${region}`} className="text-sm">
                                  {region}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="timeSensitive"
                          checked={formData.timeSensitive}
                          onCheckedChange={(checked) => handleFormChange('timeSensitive', checked)}
                        />
                        <Label htmlFor="timeSensitive" className="text-sm">Time Sensitive Content</Label>
                      </div>
                      
                      {formData.timeSensitive && (
                        <div className="ml-6 grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate" className="text-sm">Expires at</Label>
                            <Input
                              id="expiryDate"
                              type="date"
                              value={formData.expiryDate}
                              onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                              className="mt-1 border-gray-300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="expiryTime" className="text-sm">Time</Label>
                            <Input
                              id="expiryTime"
                              type="time"
                              value={formData.expiryTime}
                              onChange={(e) => handleFormChange('expiryTime', e.target.value)}
                              className="mt-1 border-gray-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating, Language, and Color */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rating" className="text-sm font-semibold">Rating</Label>
                      <Select
                        value={formData.rating}
                        onValueChange={(value) => handleFormChange('rating', value)}
                      >
                        <SelectTrigger className="mt-1 border-gray-300">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATINGS.map(rating => (
                            <SelectItem key={rating.value} value={rating.value}>
                              {rating.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="language" className="text-sm font-semibold">Language</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (!formData.language.includes(value)) {
                            handleFormChange('language', [...formData.language, value]);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1 border-gray-300">
                          <SelectValue placeholder="Add language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.language.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.language.map(lang => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {LANGUAGES.find(l => l.value === lang)?.label}
                              <button
                                type="button"
                                onClick={() => handleFormChange('language', formData.language.filter(l => l !== lang))}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="create-program-button"
            >
              Create Program
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
