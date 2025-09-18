import { FC } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

interface EpgXlsTableProps {
  channelId?: string;
  date: Date;
  timezone: string;
  programs: EPGPreviewItem[];
}

const EpgXlsTable: FC<EpgXlsTableProps> = ({ channelId, date, timezone, programs }) => {
  const { toast } = useToast();

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Filter programs for the selected date
  const dateKey = date.toISOString().split('T')[0];
  const dayPrograms = programs.filter(p => p.time.startsWith(dateKey));

  const generateTableData = () => {
    return dayPrograms.map((item) => ({
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
  };

  const handleDownloadXLS = () => {
    const data = generateTableData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EPG");
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    XLSX.writeFile(workbook, `epg_${dateStr}.xls`);
    toast({ title: "XLS file downloaded successfully." });
  };

  const handleDownloadJSON = () => {
    const data = generateTableData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: "application/json;charset=utf-8;" 
    });
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    saveAs(blob, `epg_${dateStr}.json`);
    toast({ title: "JSON file downloaded successfully." });
  };

  const handleDownloadXML = () => {
    const data = generateTableData();
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
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    saveAs(blob, `epg_${dateStr}.xml`);
    toast({ title: "XML file downloaded successfully." });
  };

  const data = generateTableData();

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No EPG entries for {date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}.
        </p>
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="space-y-4">
      {/* XLS Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse border border-black border-dotted">
          <thead>
            <tr className="bg-gray-200">
              {headers.map((header) => (
                <th key={header} className="p-2 font-bold text-black border border-black border-dotted">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-black border-dotted hover:bg-gray-50">
                {headers.map((header) => (
                  <td key={header} className="p-2 border border-black border-dotted">
                    {row[header as keyof typeof row]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EpgXlsTable;
