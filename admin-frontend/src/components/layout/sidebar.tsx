"use client";

import { useAuth } from "@/hooks/use-auth";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";
import { NAV_GROUPS, filterNavGroups } from "./nav-config";

export function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const visibleGroups = filterNavGroups(NAV_GROUPS, user.role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarBrand role={user.role} />
      <SidebarNav groups={visibleGroups} />
      <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-muted-foreground">
        Admin Portal v1.0
      </div>
    </aside>
  );
}
