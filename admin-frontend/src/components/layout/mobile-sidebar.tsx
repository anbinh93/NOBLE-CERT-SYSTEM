'use client';

import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarBrand } from './sidebar-brand';
import { SidebarNav } from './sidebar-nav';
import { NAV_GROUPS, filterNavGroups } from './nav-config';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const visibleGroups = filterNavGroups(NAV_GROUPS, user.role);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="left" className="w-60 p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarBrand role={user.role} />
        <SidebarNav groups={visibleGroups} onNavigate={onClose} />
        <div className="border-t px-5 py-3 text-[11px] text-slate-400">
          Admin Portal v1.0 &nbsp;·&nbsp; {user.role}
        </div>
      </SheetContent>
    </Sheet>
  );
}
