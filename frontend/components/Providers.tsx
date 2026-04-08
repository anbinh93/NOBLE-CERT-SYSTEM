"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  if (!SessionProvider) {
    console.error("Critical Error: SessionProvider is undefined.");
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
        <I18nProvider>
          {children}
        </I18nProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
