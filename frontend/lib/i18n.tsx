"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Locale = "vi" | "en";

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "noble-cert-locale";

const translationCache: Partial<Record<Locale, Translations>> = {};

async function loadTranslations(locale: Locale): Promise<Translations> {
  if (translationCache[locale]) return translationCache[locale]!;
  let mod;
  if (locale === "en") mod = await import("@/locales/en");
  else mod = await import("@/locales/vi");
  translationCache[locale] = mod.default;
  return mod.default;
}

function resolvePath(obj: Translations, path: string): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj) as string ?? path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) as Locale | null;
    const validLocales: Locale[] = ["vi", "en"];
    const initial: Locale = saved && validLocales.includes(saved) ? saved : "vi";
    setLocaleState(initial);
    loadTranslations(initial).then(setTranslations);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    loadTranslations(next).then(setTranslations);
  }, []);

  const t = useCallback((key: string) => resolvePath(translations, key), [translations]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
