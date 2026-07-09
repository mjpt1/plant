"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { CareNotificationWatcher } from "@/components/CareNotificationWatcher";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n";

export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <ThemeProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16 pb-20 md:pb-8 min-h-screen">
            <AppShell>{children}</AppShell>
          </main>
          <Toaster richColors position="top-center" />
          <PwaInstallPrompt />
          <CareNotificationWatcher />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
