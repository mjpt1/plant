"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Leaf,
  Camera,
  Calendar,
  Sun,
  Moon,
  Menu,
  X,
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

const publicNavItems = [
  { href: "/", icon: Leaf, key: "home" as const },
  { href: "/catalog", icon: BookOpen, key: "catalog" as const },
  { href: "/plants", icon: Sprout, key: "myPlants" as const },
  { href: "/scan", icon: Camera, key: "scan" as const },
  { href: "/calendar", icon: Calendar, key: "calendar" as const },
];

const communityNavItems = [
  { href: "/social", icon: MessageCircle, key: "social" as const },
  { href: "/qa", icon: MessageCircleQuestion, key: "qa" as const },
];

const authNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/catalog", icon: BookOpen, key: "catalog" as const },
  { href: "/plants", icon: Sprout, key: "myPlants" as const },
  { href: "/scan", icon: Camera, key: "scan" as const },
  { href: "/calendar", icon: Calendar, key: "calendar" as const },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t, direction } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = user ? authNavItems : publicNavItems;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent hidden sm:block">
                {t.app.name}
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive(href)
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{t.nav[key]}</span>
                </Link>
              ))}
              {communityNavItems.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive(href)
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{t.nav[key]}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              <button
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <div className="relative hidden sm:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                    {user ? (
                      <span className="text-white text-sm font-medium">
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
                      "absolute top-full mt-2 w-48 glass rounded-xl border border-white/10 shadow-xl py-2",
                      direction === "rtl" ? "left-0" : "right-0"
                    )}
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-white/10">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t.nav.dashboard}
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                        >
                          <User className="w-4 h-4" />
                          {t.dashboard.actions.settings}
                        </Link>
                        {(user.role === "EXPERT" || user.role === "ADMIN") && (
                          <Link
                            href="/expert"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                          >
                            <BadgeCheck className="w-4 h-4" />
                            {t.expert.title}
                          </Link>
                        )}
                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                          >
                            <Shield className="w-4 h-4" />
                            {t.admin.title}
                          </Link>
                        )}
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                        >
                          <User className="w-4 h-4" />
                          {t.nav.profile}
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-white/10"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.nav.logout}
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/auth/login"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        <LogIn className="w-4 h-4" />
                        {t.nav.login}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-white/10"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 glass">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive(href)
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {t.nav[key]}
                </Link>
              ))}
              {communityNavItems.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive(href)
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {t.nav[key]}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300"
                >
                  <LogIn className="w-5 h-5" />
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden glass border-t border-white/10 safe-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ href, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive(href)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.nav[key]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
