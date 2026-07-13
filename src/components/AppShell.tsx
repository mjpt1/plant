"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  Sprout,
  Calendar,
  BookOpen,
  MessageCircle,
  MessageCircleQuestion,
  Settings,
  Shield,
  BadgeCheck,
  Leaf,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/scan", icon: Camera, key: "scan" as const },
  { href: "/plants", icon: Sprout, key: "myPlants" as const },
  { href: "/catalog", icon: BookOpen, key: "catalog" as const },
  { href: "/calendar", icon: Calendar, key: "calendar" as const },
];

const communityItems = [
  { href: "/social", icon: MessageCircle, key: "social" as const },
  { href: "/qa", icon: MessageCircleQuestion, key: "qa" as const },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="hidden lg:flex flex-col w-[17.5rem] shrink-0 h-[calc(100vh-4.5rem)] sticky top-[4.5rem]">
      <div className="m-3 flex flex-1 flex-col overflow-hidden rounded-3xl border border-border/50 glass shadow-xl shadow-rose-500/5">
        <div className="p-4 border-b border-border/40 bg-gradient-to-l from-rose-300/20 via-amber-200/15 to-emerald-300/15">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="brand-mark group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{t.app.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.nav.care}
            </p>
            {sidebarItems.map(({ href, icon: Icon, key }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "sidebar-link",
                  isActive(href) && "sidebar-link-active"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.nav[key]}
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.nav.community}
            </p>
            {communityItems.map(({ href, icon: Icon, key }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "sidebar-link",
                  isActive(href) && "sidebar-link-active"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.nav[key]}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-border/40 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "sidebar-link",
              pathname === "/settings" && "sidebar-link-active"
            )}
          >
            <Settings className="w-4 h-4" />
            {t.dashboard.actions.settings}
          </Link>
          {(user.role === "EXPERT" || user.role === "ADMIN") && (
            <Link
              href="/expert"
              className={cn(
                "sidebar-link",
                pathname.startsWith("/expert") && "sidebar-link-active"
              )}
            >
              <BadgeCheck className="w-4 h-4" />
              {t.expert.title}
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "sidebar-link",
                pathname.startsWith("/admin") && "sidebar-link-active"
              )}
            >
              <Shield className="w-4 h-4" />
              {t.admin.title}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex-1 w-full">{children}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex gap-0 lg:gap-2 px-0 lg:px-4">
      <AppSidebar />
      <div className="flex-1 min-w-0 w-full lg:pt-3">{children}</div>
    </div>
  );
}
