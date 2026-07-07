"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{t.offline.title}</h1>
          <p className="text-muted-foreground">{t.offline.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t.offline.retry}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{t.nav.home}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
