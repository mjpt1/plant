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
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-e border-border/50 glass h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm">{t.app.name}</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map(({ href, icon: Icon, key }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {t.nav[key]}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          <Settings className="w-4 h-4" />
          {t.dashboard.actions.settings}
        </Link>
        {(user.role === "EXPERT" || user.role === "ADMIN") && (
          <Link
            href="/expert"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith("/expert")
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent"
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
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Shield className="w-4 h-4" />
            {t.admin.title}
          </Link>
        )}
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
    <div className="max-w-7xl mx-auto w-full flex gap-0 lg:gap-6 px-0 lg:px-6">
      <AppSidebar />
      <div className="flex-1 min-w-0 w-full">{children}</div>
    </div>
  );
}
