import { Home, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Props = { 
  title: string; 
  fullWidth?: boolean;
  showBackToPlaylists?: boolean;
  onBackToPlaylists?: () => void;
  rightContent?: React.ReactNode;
};

export default function PageHeader({ 
  title, 
  fullWidth, 
  showBackToPlaylists = false, 
  onBackToPlaylists,
  rightContent 
}: Props) {
  return (
    <div
      className={`flex items-center justify-between border-b pb-2 mb-4 px-6 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {/* Left side - Breadcrumb navigation */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Link
          to="/dashboard"
          aria-label="Go to Dashboard"
          title="Dashboard"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex-shrink-0"
        >
          <Home className="w-5 h-5" />
        </Link>
        
        {showBackToPlaylists && (
          <Button
            variant="ghost"
            onClick={onBackToPlaylists}
            className="text-gray-500 hover:text-gray-700 hover:underline p-0 h-auto font-normal flex-shrink-0 hidden sm:flex"
            aria-label="Back to Playlists"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back To Playlists
          </Button>
        )}
        
        {/* Mobile back button */}
        {showBackToPlaylists && (
          <Button
            variant="ghost"
            onClick={onBackToPlaylists}
            className="text-gray-500 hover:text-gray-700 p-1 h-auto font-normal flex sm:hidden"
            aria-label="Back to Playlists"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        <h1 className="text-lg font-semibold text-gray-800 truncate">{title}</h1>
      </div>
      
      {/* Right side - Action buttons */}
      {rightContent && (
        <div className="flex items-center flex-shrink-0 ml-4 pt-1.5">
          {rightContent}
        </div>
      )}
    </div>
  );
}


