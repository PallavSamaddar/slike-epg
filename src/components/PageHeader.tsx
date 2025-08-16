import { Home } from "lucide-react";
import { Link } from "react-router-dom";

type Props = { title: string; fullWidth?: boolean };

export default function PageHeader({ title, fullWidth }: Props) {
  return (
    <div
      className={`flex items-center justify-start gap-3 border-b pb-2 mb-4 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <Link
        to="/dashboard"
        aria-label="Go to Dashboard"
        title="Dashboard"
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
      >
        <Home className="w-5 h-5" />
      </Link>
      <h1 className="page-heading text-slate-800 font-semibold">{title}</h1>
    </div>
  );
}


