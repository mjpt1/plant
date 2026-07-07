"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const { t } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
    }
  };

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-4 md:inset-x-auto md:end-4 z-40 max-w-sm glass-card p-4 shadow-xl border border-emerald-500/20 animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-2 end-2 p-1 rounded-lg hover:bg-accent text-muted-foreground"
        aria-label={t.common.close}
      >
        <X className="w-4 h-4" />
      </button>
      <p className="font-medium text-sm pe-6">{t.common.installApp}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{t.common.installAppDesc}</p>
      <Button size="sm" onClick={install} className="w-full">
        <Download className="w-4 h-4" />
        {t.common.installApp}
      </Button>
    </div>
  );
}
