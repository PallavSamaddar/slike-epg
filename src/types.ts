export interface EPGItem {
  id: string;
  time: string;
  title: string;
  type: 'VOD' | 'Event' | 'PCR' | 'MCR';
  duration: number;
  geoZone: string;
  description?: string;
  status: 'live' | 'scheduled' | 'completed' | 'offline';
  genre: string;
  isEditing?: boolean;
  imageUrl?: string;
} 