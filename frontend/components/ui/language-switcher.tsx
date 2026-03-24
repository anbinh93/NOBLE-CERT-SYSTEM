"use client";

import { useRef, useState, useEffect } from "react";
import { useI18n, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LOCALES.find((l) => l.value === locale);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
        aria-label="Switch language"
        title={`Language: ${current?.label}`}
      >
        <Globe size={20} />
        <span className="text-xs font-semibold uppercase hidden sm:inline">
          {locale}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-primary/20 rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-top-2 z-50">
          {LOCALES.map((l) => (
            <button
              key={l.value}
              onClick={() => {
                setLocale(l.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                locale === l.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {locale === l.value && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
