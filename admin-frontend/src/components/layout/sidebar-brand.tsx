import Image from 'next/image';
import Link from 'next/link';
// import { type Role } from '@/types/auth';
// import { cn } from '@/lib/utils';

// const ROLE_BADGE_STYLES: Record<Role, string> = {
//   SUPER_ADMIN: 'bg-primary/20 text-primary border border-primary/30',
//   INSTRUCTOR: 'bg-secondary text-secondary-foreground border border-border',
//   STAFF: 'bg-accent text-accent-foreground border border-accent/30',
//   STUDENT: 'bg-muted text-muted-foreground border border-border',
// };

export function SidebarBrand() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-border bg-card">
          <Image
            src="/logo.webp"
            alt="Noble Cert"
            fill
            className="object-cover"
            unoptimized
            priority
          />
        </div>
        <span className="truncate text-base font-bold text-foreground leading-none">
          Noble Cert
        </span>
      </Link>
    </div>
  );
}
