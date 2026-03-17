"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, CreditCard, LogOut, Settings, Award, ShoppingBag } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Learning", href: "/student/learning", icon: BookOpen }, 
  { label: "Certificates", href: "/student/certificates", icon: Award },
  { label: "Billing", href: "/student/billing", icon: CreditCard },
  { label: "Orders", href: "/student/orders", icon: ShoppingBag },
  { label: "Settings", href: "/student/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const TRANSLATED_NAV_ITEMS = [
    { label: "Bảng điều khiển", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Học tập", href: "/student/learning", icon: BookOpen }, 
    { label: "Chứng chỉ", href: "/student/certificates", icon: Award },
    { label: "Thanh toán", href: "/student/billing", icon: CreditCard },
    // { label: "Lịch sử đơn hàng", href: "/student/orders", icon: ShoppingBag },
    { label: "Cài đặt", href: "/student/settings", icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-primary/20 flex-shrink-0 md:h-[calc(100vh-64px)] md:sticky md:top-16 overflow-y-auto">
      <div className="p-4 md:p-6">
        <h2 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-4 px-2 hidden md:block font-serif">
            Menu
        </h2>
        
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {TRANSLATED_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname !== "/student/dashboard" && pathname.startsWith(item.href)); // Fix simple dashboard conflict
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-medium border border-transparent",
                  isActive
                    ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground/70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-8 pt-8 border-t border-primary/10 hidden md:block">
             <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors whitespace-nowrap"
             >
                 <LogOut className="h-5 w-5" />
                 <span>Đăng xuất</span>
             </button>
        </div>
      </div>
    </aside>
  );
}
