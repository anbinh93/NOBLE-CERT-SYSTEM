import Link from "next/link";
import { type Role } from "@/types/auth";
import { cn } from "@/lib/utils";

const ROLE_BADGE_STYLES: Record<Role, string> = {
  "Super Admin": "bg-primary/20 text-primary border border-primary/30",
  Instructor:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  Support:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
};

interface SidebarBrandProps {
  role?: Role;
}

export function SidebarBrand({ role }: SidebarBrandProps) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-border">
          <img
            src="/logo.webp"
            alt="Noble Cert"
            className="h-full w-full object-cover"
          />
        </div>
        <span className="truncate text-base font-bold text-foreground leading-none">
          Noble Cert
        </span>
      </Link>
      {role && (
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            ROLE_BADGE_STYLES[role],
          )}
        >
          {role}
        </span>
      )}
    </div>
  );
}
