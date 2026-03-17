import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-slate-500 py-4">
      <Link href="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
        <Home size={16} />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
            <ChevronRight size={14} className="mx-2 text-slate-400" />
            
            {item.href ? (
                <Link href={item.href} className="hover:text-blue-600 transition-colors">
                    {item.label}
                </Link>
            ) : (
                <span className="font-semibold text-slate-800">{item.label}</span>
            )}
        </div>
      ))}
    </nav>
  );
}
