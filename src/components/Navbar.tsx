"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Leaf,
  Camera,
  Calendar,
  Sun,
  Moon,
  User,
  LogOut,
  LogIn,
  BookOpen,
  LayoutDashboard,
  Sprout,
  MessageCircle,
  MessageCircleQuestion,
  BadgeCheck,
  Shield,
  Settings,
  X,
  Heart,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

type NavKey =
  | "home"
  | "catalog"
  | "myPlants"
  | "scan"
  | "calendar"
  | "dashboard"
  | "social"
  | "qa"
  | "care";

type DockItem = {
  href: string;
  icon: typeof Leaf;
  key: NavKey;
  labelKey?: "home" | "care" | "scan" | "calendar" | "me" | "catalog";
};

const guestDock: DockItem[] = [
  { href: "/", icon: Leaf, key: "home", labelKey: "home" },
  { href: "/catalog", icon: Heart, key: "catalog", labelKey: "care" },
  { href: "/scan", icon: Camera, key: "scan", labelKey: "scan" },
  { href: "/calendar", icon: Calendar, key: "calendar", labelKey: "calendar" },
];

const authDock: DockItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard", labelKey: "home" },
  { href: "/plants", icon: Sprout, key: "myPlants", labelKey: "care" },
  { href: "/scan", icon: Camera, key: "scan", labelKey: "scan" },
  { href: "/calendar", icon: Calendar, key: "calendar", labelKey: "calendar" },
];

const desktopPrimaryGuest = [
  { href: "/", icon: Leaf, key: "home" as const },
  { href: "/catalog", icon: BookOpen, key: "catalog" as const },
  { href: "/scan", icon: Camera, key: "scan" as const },
  { href: "/calendar", icon: Calendar, key: "calendar" as const },
];

const desktopPrimaryAuth = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/plants", icon: Sprout, key: "myPlants" as const },
  { href: "/scan", icon: Camera, key: "scan" as const },
  { href: "/calendar", icon: Calendar, key: "calendar" as const },
];

const communityItems = [
  { href: "/social", icon: MessageCircle, key: "social" as const },
  { href: "/qa", icon: MessageCircleQuestion, key: "qa" as const },
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function dockLabel(
  t: ReturnType<typeof useLanguage>["t"],
  item: DockItem
) {
  if (item.labelKey === "me") return t.nav.me;
  if (item.labelKey === "care") return t.nav.care;
  if (item.labelKey === "home") return t.nav.home;
  if (item.labelKey === "catalog") return t.nav.catalog;
  return t.nav[item.key === "dashboard" ? "dashboard" : item.key];
}

export default function Navbar() {
  const pathname = usePathname();
  const { t, direction } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const dock = user ? authDock : guestDock;
  const desktopPrimary = user ? desktopPrimaryAuth : desktopPrimaryGuest;
  const sideItems = dock.filter((item) => item.key !== "scan");
  const scanItem = dock.find((item) => item.key === "scan")!;
  const leftItems = sideItems.slice(0, 2);
  const rightItems = sideItems.slice(2);

  useEffect(() => {
    setMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  const closeMenus = () => {
    setMoreOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="brand-mark group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <div className="leading-tight hidden sm:block">
                <span className="block font-bold text-[15px] tracking-tight text-foreground">
                  {t.app.name}
                </span>
                <span className="block text-[11px] text-muted-foreground font-medium">
                  {t.nav.care}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {desktopPrimary.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "nav-link",
                    isActivePath(pathname, href) && "nav-link-active"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.nav[key]}</span>
                </Link>
              ))}
              <span className="mx-1 h-5 w-px bg-border/70" aria-hidden />
              {communityItems.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "nav-link",
                    isActivePath(pathname, href) && "nav-link-active"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{t.nav[key]}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher />

              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-rose-400/10 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setMoreOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-rose-400/10 transition-colors"
                  aria-expanded={profileOpen}
                  aria-label={t.nav.menu}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 via-amber-300 to-violet-400 flex items-center justify-center ring-2 ring-background shadow-md shadow-rose-400/25">
                    {user ? (
                      <span className="text-white text-sm font-semibold drop-shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>

                {profileOpen && (
                  <div
                    className={cn(
                      "absolute top-full mt-2 w-56 glass-card py-2 animate-fade-in",
                      direction === "rtl" ? "left-0" : "right-0"
                    )}
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t.nav.dashboard}
                        </Link>
                        <Link
                          href="/settings"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                        >
                          <Settings className="w-4 h-4" />
                          {t.dashboard.actions.settings}
                        </Link>
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.profile}
                        </Link>
                        {(user.role === "EXPERT" || user.role === "ADMIN") && (
                          <Link
                            href="/expert"
                            onClick={closeMenus}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                          >
                            <BadgeCheck className="w-4 h-4" />
                            {t.expert.title}
                          </Link>
                        )}
                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            onClick={closeMenus}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                          >
                            <Shield className="w-4 h-4" />
                            {t.admin.title}
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            closeMenus();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.nav.logout}
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/auth/login"
                        onClick={closeMenus}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-400/10"
                      >
                        <LogIn className="w-4 h-4" />
                        {t.nav.login}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile floating dock — 5 tabs, scan larger in center */}
      <nav
        className="fixed bottom-3 inset-x-3 z-50 md:hidden safe-bottom"
        aria-label={t.nav.menu}
      >
        <div className="dock-glass grid grid-cols-5 items-end gap-0 rounded-full px-1.5 pt-1.5 pb-2">
          {leftItems.map(({ href, icon: Icon, key, labelKey }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href + key}
                href={href}
                className={cn("dock-item", active && "dock-item-active")}
              >
                <span className={cn("dock-ico", active && "dock-ico-active animate-dock-pop")}>
                  <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                  {dockLabel(t, { href, icon: Icon, key, labelKey })}
                </span>
                {active && <span className="dock-dot" aria-hidden />}
              </Link>
            );
          })}

          <Link
            href={scanItem.href}
            className="dock-item text-emerald-500"
            aria-label={t.nav.scan}
          >
            <span
              className={cn(
                "dock-scan",
                isActivePath(pathname, scanItem.href) && "scale-105 ring-emerald-200"
              )}
            >
              <Camera className="w-6 h-6" strokeWidth={2.1} />
            </span>
            <span
              className={cn(
                "text-[10px] font-bold leading-tight",
                isActivePath(pathname, scanItem.href)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {t.nav.scan}
            </span>
            {isActivePath(pathname, scanItem.href) && (
              <span className="dock-dot !bg-emerald-500 !shadow-emerald-500/25" aria-hidden />
            )}
          </Link>

          {rightItems.map(({ href, icon: Icon, key, labelKey }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href + key}
                href={href}
                className={cn("dock-item", active && "dock-item-active")}
              >
                <span className={cn("dock-ico", active && "dock-ico-active animate-dock-pop")}>
                  <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                  {dockLabel(t, { href, icon: Icon, key, labelKey })}
                </span>
                {active && <span className="dock-dot" aria-hidden />}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setMoreOpen(true);
              setProfileOpen(false);
            }}
            className={cn("dock-item", moreOpen && "dock-item-active")}
            aria-label={t.nav.me}
          >
            <span className={cn("dock-ico", moreOpen && "dock-ico-active")}>
              <User className="w-[19px] h-[19px]" strokeWidth={moreOpen ? 2.4 : 1.9} />
            </span>
            <span className="text-[10px] font-bold leading-tight">{t.nav.me}</span>
            {moreOpen && <span className="dock-dot" aria-hidden />}
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <button
            type="button"
            className="sheet-overlay md:hidden"
            aria-label={t.common.close}
            onClick={() => setMoreOpen(false)}
          />
          <div className="sheet-panel md:hidden" role="dialog" aria-modal="true">
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <div>
                <p className="font-bold text-base">{t.nav.me}</p>
                <p className="text-xs text-muted-foreground">{t.nav.community}</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-xl hover:bg-rose-400/10 text-muted-foreground"
                aria-label={t.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-6 space-y-4">
              <section>
                <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.nav.care}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { href: "/catalog", icon: BookOpen, key: "catalog" as const },
                      ...(user
                        ? [{ href: "/plants", icon: Sprout, key: "myPlants" as const }]
                        : [{ href: "/", icon: Leaf, key: "home" as const }]),
                    ] as const
                  ).map(({ href, icon: Icon, key }) => (
                    <Link
                      key={href + key}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-3.5 py-3.5 text-sm font-medium transition-colors hover:border-rose-400/30 hover:bg-rose-400/10",
                        isActivePath(pathname, href) &&
                          "border-rose-400/35 bg-rose-400/10 text-rose-700 dark:text-rose-300"
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-300/40 to-amber-200/40 text-rose-600 dark:text-rose-300">
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      {t.nav[key]}
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.nav.community}
                </p>
                <div className="space-y-1.5">
                  {communityItems.map(({ href, icon: Icon, key }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors hover:bg-rose-400/10",
                        isActivePath(pathname, href) &&
                          "bg-rose-400/10 text-rose-700 dark:text-rose-300"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {t.nav[key]}
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-background/40 p-2">
                {user ? (
                  <>
                    <Link
                      href="/settings"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-rose-400/10"
                    >
                      <Settings className="w-5 h-5" />
                      {t.dashboard.actions.settings}
                    </Link>
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-rose-400/10"
                    >
                      <User className="w-5 h-5" />
                      {t.nav.profile}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMoreOpen(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="w-5 h-5" />
                      {t.nav.logout}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-rose-400 via-amber-300 to-emerald-400 px-3 py-3.5 text-sm font-semibold text-stone-800 shadow-lg shadow-rose-400/25"
                  >
                    <LogIn className="w-5 h-5" />
                    {t.nav.login}
                  </Link>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
