"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";
import { NAV_GROUPS, filterNavGroups } from "./nav-config";

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
      <SheetContent side="left" className="w-60 p-0 flex flex-col bg-sidebar">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarBrand role={user.role} />
        <SidebarNav groups={visibleGroups} onNavigate={onClose} />
        <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-muted-foreground">
          Admin Portal v1.0
        </div>
      </SheetContent>
    </Sheet>
  );
}
