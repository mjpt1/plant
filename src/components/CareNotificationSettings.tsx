"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getNotificationPermission,
  isCareNotificationsEnabled,
  isNotificationSupported,
  requestNotificationPermission,
  setCareNotificationsEnabled,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from "@/lib/care-notifications";

export function CareNotificationSettings() {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [pushAvailable, setPushAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnabled(isCareNotificationsEnabled());
    setPermission(getNotificationPermission());

    void fetch("/api/push/vapid-public-key")
      .then((res) => setPushAvailable(res.ok))
      .catch(() => setPushAvailable(false));
  }, []);

  const handleEnable = async () => {
    if (!isNotificationSupported()) {
      toast.error(t.settings.notificationsUnsupported);
      return;
    }

    setLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setLoading(false);

    if (result === "granted") {
      setCareNotificationsEnabled(true);
      setEnabled(true);

      if (pushAvailable && process.env.NODE_ENV === "production") {
        const subscribed = await subscribeToWebPush();
        if (subscribed) {
          toast.success(t.settings.notificationsPushEnabled);
        } else {
          toast.success(t.settings.notificationsEnabled);
        }
      } else {
        toast.success(t.settings.notificationsEnabled);
      }
    } else if (result === "denied") {
      toast.error(t.settings.notificationsDenied);
    }
  };

  const handleDisable = async () => {
    setCareNotificationsEnabled(false);
    setEnabled(false);
    if (pushAvailable) {
      await unsubscribeFromWebPush();
    }
    toast.message(t.settings.notificationsDisabled);
  };

  const statusLabel =
    permission === "unsupported"
      ? t.settings.notificationsUnsupported
      : permission === "granted" && enabled
        ? t.settings.notificationsOn
        : permission === "denied"
          ? t.settings.notificationsDenied
          : t.settings.notificationsOff;

  return (
    <Card className="glass-card border-0 mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {t.settings.notifications}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t.settings.notificationsDesc}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{statusLabel}</p>

        {!enabled || permission !== "granted" ? (
          <Button
            className="w-full"
            onClick={() => void handleEnable()}
            disabled={loading || permission === "unsupported" || permission === "denied"}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BellRing className="w-4 h-4" />
            )}
            {t.settings.notificationsEnable}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => void handleDisable()}>
            <BellOff className="w-4 h-4" />
            {t.settings.notificationsDisable}
          </Button>
        )}

        {pushAvailable && enabled && permission === "granted" && (
          <p className="text-xs text-muted-foreground">{t.settings.notificationsPushHint}</p>
        )}

        {permission === "denied" && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t.settings.notificationsDeniedHint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
