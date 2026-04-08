"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/lib/i18n";
import {
  LogOut,
  User,
  Award,
  Settings,
  BookOpen,
  Search,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for header shrink
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        exploreRef.current &&
        !exploreRef.current.contains(event.target as Node)
      ) {
        setIsExploreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header className={`sticky top-0 z-50 transition-all duration-300 border-b border-primary/10 ${isScrolled ? "h-[60px] bg-background/95 backdrop-blur-md shadow-md" : "h-[72px] bg-background/90 backdrop-blur-sm"}`}>
      <div className="container mx-auto px-4 h-full flex items-center gap-6">
        {/* LEFT: Logo & Nav */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif font-bold text-xl lg:text-2xl text-primary tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="relative w-8 h-8">
              <Image
                src="/logo.webp"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="hidden sm:inline">Noble Language Academy</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {/* Explore Mega Menu */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setIsExploreOpen(!isExploreOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-colors border cursor-pointer ${isExploreOpen ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-foreground/70 border-transparent hover:bg-primary/10 hover:text-primary"}`}
              >
                {t("header.explore")}{" "}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isExploreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isExploreOpen && (
                <div className="absolute top-full left-0 mt-4 w-[600px] bg-card/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-border p-6 grid grid-cols-2 gap-8 z-50 animate-in fade-in slide-in-from-top-2">
                  {/* Column 1: Goals */}
                  <div>
                    <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider font-serif border-b border-border pb-2">
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
                    <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider font-serif border-b border-border pb-2">
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
                          href="/courses?topic=language"
                          className="text-foreground/80 hover:text-primary text-sm font-medium block transition-colors flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>{" "}
                          {t("header.topics.language")}
                        </Link>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-border">
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

            <Link
              href="/blog"
              className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors"
            >
              {t("header.blog")}
            </Link>

            {status === "authenticated" && (
              <Link
                href="/student/dashboard"
                className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors"
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
              className="w-full h-10 pl-4 pr-10 rounded-full border border-border bg-card/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <LanguageSwitcher />

          {status === "authenticated" ? (
            <>
              {/* User Avatar & Dropdown */}
              <div
                className="relative pl-2 border-l border-border"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-9 h-9 relative rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all">
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
                  <div className="absolute right-0 mt-3 w-64 bg-card rounded-xl shadow-2xl border border-border py-2 animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-3 border-b border-border bg-muted/30 rounded-t-xl">
                      <p className="font-bold text-sm text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-2 border-b border-border">
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
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
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
                className="hidden md:block px-4 py-2 text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                {t("header.auth.signIn")}
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-secondary rounded-full shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
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
