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
    <nav className="flex items-center text-sm text-muted-foreground py-4">
      <Link href="/" className="hover:text-primary flex items-center gap-1 transition-colors">
        <Home size={16} />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
            <ChevronRight size={14} className="mx-2 text-muted-foreground" />
            
            {item.href ? (
                <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                </Link>
            ) : (
                <span className="font-semibold text-foreground">{item.label}</span>
            )}
        </div>
      ))}
    </nav>
  );
}
