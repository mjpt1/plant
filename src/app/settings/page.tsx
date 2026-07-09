"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, User, Globe, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { CareNotificationSettings } from "@/components/CareNotificationSettings";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { update } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCountry(user.country || "");
      setCity(user.city || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country, city, bio }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      await update({ user: { name, country, city, bio } });
      await refreshUser();
      toast.success(t.settings.saved);
      if (data.schedulesRegenerated > 0) {
        toast.message(t.settings.schedulesRegenerated);
      }
    } else {
      toast.error(t.common.error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{t.settings.title}</h1>
      <p className="text-muted-foreground mb-8">{t.settings.subtitle}</p>

      <Card className="glass-card border-0 mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {t.settings.account}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>{t.auth.name}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t.profile.country}</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t.profile.city}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{t.plants.notes}</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" rows={3} />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.profile.save}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t.settings.socialAccounts}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.settings.socialAccountsDesc}</p>
        </CardHeader>
        <CardContent>
          <OAuthButtons callbackUrl="/settings" />
        </CardContent>
      </Card>

      <CareNotificationSettings />

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base">{t.settings.preferences}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4" />
              {t.settings.language}
            </div>
            <LanguageSwitcher variant="buttons" />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {t.settings.theme}: {theme === "dark" ? t.theme.dark : t.theme.light}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
