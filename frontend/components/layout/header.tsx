"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import useSWR from "swr"; // Added SWR
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { ModeToggle } from "@/components/mode-toggle"; // Added import
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/lib/i18n";
import {
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  Award,
  Receipt,
  Settings,
  Moon,
  BookOpen,
  Search,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  // Notifications Logic
  const { data: notifData, mutate: mutateNotif } = useSWR(
    session?.user?.email
      ? `/api/notifications/mine?email=${session?.user?.email}`
      : null,
    (url: string) => fetch(url).then((r) => r.json()),
  );
  const unreadCount = notifData?.unreadCount || 0;
  const notifications = notifData?.data || [];
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
      if (
        exploreRef.current &&
        !exploreRef.current.contains(event.target as Node)
      ) {
        setIsExploreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string, link?: string) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email }),
    });
    mutateNotif(); // Revalidate
    // If link, we rely on Link component or router push.
    // This function is mainly for binding to an onClick.
    setIsNotifOpen(false);
  };

  // Avatar Logic
  const user = session?.user;
  const hasAvatar = !!user?.image;

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <header className="h-[64px] bg-background/90 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 h-full flex items-center gap-6">
        {/* LEFT: Logo & Nav */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif font-bold text-2xl text-primary tracking-tight hover:brightness-110 transition-all"
          >
            <div className="relative w-8 h-8">
              <Image
                src="/logo.webp"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            Noble Cert
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {/* Explore Mega Menu */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setIsExploreOpen(!isExploreOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-colors border ${isExploreOpen ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-transparent hover:bg-primary/10 hover:text-primary"}`}
              >
                {t("header.explore")}{" "}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isExploreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isExploreOpen && (
                <div className="absolute top-full left-0 mt-4 w-[600px] bg-card/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-primary/20 p-6 grid grid-cols-2 gap-8 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* Column 1: Goals */}
                  <div>
                    <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider font-serif border-b border-primary/20 pb-2">
                      {t("header.goals.title")}
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          href="/courses?goal=free"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.goals.free")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?goal=cert"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.goals.cert")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?goal=degree"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.goals.degree")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?goal=skill"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.goals.skill")}
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Topics */}
                  <div>
                    <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider font-serif border-b border-primary/20 pb-2">
                      {t("header.topics.title")}
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <Link
                          href="/courses?topic=data-science"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.topics.dataScience")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?topic=business"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.topics.business")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?topic=cs"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.topics.cs")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?topic=it"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.topics.it")}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/courses?topic=language"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.topics.language")}
                        </Link>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-primary/10">
                      <Link
                        href="/courses"
                        className="text-primary text-sm font-bold hover:underline flex items-center gap-1 group"
                      >
                        {t("header.topics.viewAll")}{" "}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {status === "authenticated" && (
              <Link
                href="/student/dashboard"
                className="text-sm font-semibold text-foreground/90 hover:text-primary transition-colors"
              >
                {t("header.myLearning")}
              </Link>
            )}
          </div>
        </div>

        {/* MIDDLE: Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = (
                e.currentTarget.elements.namedItem("search") as HTMLInputElement
              ).value;
              if (query.trim()) {
                router.push("/courses?search=" + encodeURIComponent(query));
              }
            }}
            className="relative group"
          >
            <input
              name="search"
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="w-full h-10 pl-4 pr-10 rounded-full border border-primary/20 bg-muted/30 text-foreground text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all shadow-inner placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <LanguageSwitcher />

          <ModeToggle />

          {status === "authenticated" ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background shadow-sm"></span>
                  )}
                </button>

                {/* NOTIFICATION VISUAL */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-card rounded-xl shadow-2xl border border-primary/20 py-2 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-primary/10 flex justify-between items-center bg-muted/30">
                      <h3 className="font-semibold text-sm text-foreground">
                        {t("header.notifications.title")}
                      </h3>
                      <button
                        onClick={() => {}}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        {t("header.notifications.markAllRead")}
                      </button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          {t("header.notifications.empty")}
                        </div>
                      ) : (
                        notifications.map((notif: any) => (
                          <div
                            key={notif._id}
                            className={`px-4 py-3 hover:bg-white/5 transition-colors border-b border-primary/5 last:border-0 ${!notif.isRead ? "bg-primary/5" : ""}`}
                          >
                            <Link
                              href={notif.link || "#"}
                              onClick={() => handleMarkRead(notif._id)}
                              className="block group"
                            >
                              <p className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                {new Date(notif.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </p>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Dropdown */}
              <div
                className="relative pl-2 border-l border-primary/10"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-9 h-9 relative rounded-full overflow-hidden border border-primary/20 group-hover:border-primary transition-all">
                    {hasAvatar ? (
                      <Image
                        src={user.image!}
                        alt="Avatar"
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(user?.name || "U")}
                      </div>
                    )}
                  </div>
                </button>

                {/* DROPDOWN MENU */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-card rounded-xl shadow-2xl border border-primary/20 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-3 border-b border-primary/10 bg-muted/30">
                      <p className="font-bold text-sm text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-2 border-b border-primary/10">
                      <Link
                        href="/student/learning"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <BookOpen size={16} /> {t("header.userMenu.learning")}
                      </Link>
                      <Link
                        href="/student/certificates"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Award size={16} /> {t("header.userMenu.certificates")}
                      </Link>
                    </div>

                    <div className="py-2">
                      <Link
                        href="/student/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Settings size={16} /> {t("header.userMenu.settings")}
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut size={16} /> {t("header.userMenu.signOut")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // GUEST Buttons
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden md:block px-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {t("header.auth.signIn")}
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-amber-400 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-0.5"
              >
                {t("header.auth.joinFree")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
