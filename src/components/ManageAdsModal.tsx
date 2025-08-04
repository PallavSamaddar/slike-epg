import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ManageAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adConfig: any) => void;
}

const adCampaigns = [
  { value: 'summer_blast', label: 'Summer Blast (0:30m)', adVideos: [{ id: 'ad1', name: 'Summer Ad 1', duration: 15 }, { id: 'ad2', name: 'Summer Ad 2', duration: 30 }] },
  { value: 'monsoon_magic', label: 'Monsoon Magic (1:00m)', adVideos: [{ id: 'ad3', name: 'Monsoon Ad 1', duration: 15 }, { id: 'ad4', name: 'Monsoon Ad 2', duration: 30 }, { id: 'ad5', name: 'Monsoon Ad 3', duration: 45 }] },
  { value: 'festive_offer', label: 'Festive Offer (1:15m)', adVideos: [{ id: 'ad6', name: 'Festive Ad 1', duration: 15 }, { id: 'ad7', name: 'Festive Ad 2', duration: 30 }, { id: 'ad8', name: 'Festive Ad 3', duration: 45 }] },
];

const adDurations = Array.from({ length: 20 }, (_, i) => {
    const totalSeconds = (i + 1) * 15;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}m`;
});

const adFrequencies = ['00:30hr', '1:00hr', '1:30hr', '2:00hr', '2:30hr', '3:00hr', '3:30hr', '4:00hr'];

export const ManageAdsModal = ({ isOpen, onClose, onSave }: ManageAdsModalProps) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(undefined);
  const [selectedDuration, setSelectedDuration] = useState<string | undefined>(undefined);
  const [selectedFrequency, setSelectedFrequency] = useState<string | undefined>(undefined);
  const [campaignError, setCampaignError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [frequencyError, setFrequencyError] = useState('');
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const selectedCampaignData = adCampaigns.find(c => c.value === selectedCampaign);
  const adVideos = selectedCampaignData?.adVideos || [];

  useEffect(() => {
    if (adVideos.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex(prevIndex => (prevIndex + 1) % adVideos.length);
      }, 2000); // Change ad every 2 seconds
      return () => clearInterval(interval);
    }
  }, [selectedCampaign, adVideos.length]);

  const handleSave = () => {
    let hasError = false;
    if (!selectedCampaign) {
      setCampaignError('Please select a campaign');
      hasError = true;
    } else {
      setCampaignError('');
    }

    if (!selectedDuration) {
      setDurationError('Please select ad duration');
      hasError = true;
    } else {
      setDurationError('');
    }

    if (!selectedFrequency) {
      setFrequencyError('Please select ad frequency');
      hasError = true;
    } else {
      setFrequencyError('');
    }

    if (!hasError) {
      onSave({
        campaign: selectedCampaign,
        duration: selectedDuration,
        frequency: selectedFrequency,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card-dark border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Manage Ads</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="campaign">Select Campaign</Label>
            <Select onValueChange={setSelectedCampaign} value={selectedCampaign}>
              <SelectTrigger id="campaign" className="w-full bg-control-surface border-border">
                <SelectValue placeholder="-- Select Campaign --" />
              </SelectTrigger>
              <SelectContent>
                {adCampaigns.map(campaign => (
                  <SelectItem key={campaign.value} value={campaign.value}>
                    {campaign.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {campaignError && <p className="text-red-500 text-xs mt-1">{campaignError}</p>}
          </div>

          {selectedCampaign && (
            <div className="mt-4 p-4 border border-dashed border-border rounded-lg">
              <Label>Ad Preview</Label>
              <div className="flex space-x-2 mt-2 overflow-hidden h-24">
                {adVideos.length > 0 && (
                   <div className="flex items-center justify-center w-full h-full bg-black/20 rounded">
                       <div className="text-center">
                           <p className="text-white">{adVideos[currentAdIndex].name}</p>
                           <p className="text-muted-foreground text-sm">{adVideos[currentAdIndex].duration}s</p>
                       </div>
                   </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="duration">Ad Duration</Label>
            <Select onValueChange={setSelectedDuration} value={selectedDuration}>
              <SelectTrigger id="duration" className="w-full bg-control-surface border-border">
                <SelectValue placeholder="-- Select Duration --" />
              </SelectTrigger>
              <SelectContent>
                {adDurations.map(duration => (
                  <SelectItem key={duration} value={duration}>
                    {duration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {durationError && <p className="text-red-500 text-xs mt-1">{durationError}</p>}
          </div>

          <div>
            <Label htmlFor="frequency">Ad Frequency</Label>
            <Select onValueChange={setSelectedFrequency} value={selectedFrequency}>
              <SelectTrigger id="frequency" className="w-full bg-control-surface border-border">
                <SelectValue placeholder="-- Select Frequency --" />
              </SelectTrigger>
              <SelectContent>
                {adFrequencies.map(frequency => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {frequencyError && <p className="text-red-500 text-xs mt-1">{frequencyError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="broadcast" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
