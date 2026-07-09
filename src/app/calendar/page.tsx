"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Droplets,
  Leaf,
  Scissors,
  Flower2,
  Check,
  Trash2,
  Loader2,
  X,
  CloudSun,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  formatDate,
  formatRelativeMonthYear,
  formatDayOfWeek,
  getCalendarDays,
  getCurrentCalendarMonth,
  isToday,
  isSameCalendarDay,
  toPersianDigits,
  parseInputDate,
  getTodayString,
} from "@/utils/dateHelper";
import { getPersianName } from "@/data/plantNames";
import { cn } from "@/lib/utils";
import type { CareReminderItem, PlantProfile } from "@/types";
import Link from "next/link";
import { toGregorian } from "@/utils/dateHelper";

const TYPE_ICONS: Record<string, typeof Droplets> = {
  watering: Droplets,
  fertilizing: Leaf,
  pruning: Scissors,
  repotting: Flower2,
  inspection: Leaf,
  custom: Flower2,
  other: Flower2,
};

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface WeatherInsight {
  location: { city: string; country: string; name: string };
  insight: {
    summaryEn: string;
    summaryFa: string;
    avgTempNext3Days: number;
    rainNext3DaysMm: number;
    avgHumidityNext3Days: number;
    adjustment: number;
  };
}

export default function CalendarPage() {
  const { t, locale, direction } = useLanguage();
  const { user } = useAuth();

  const [currentMonth, setCurrentMonth] = useState(() =>
    getCurrentCalendarMonth(locale)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<CareReminderItem[]>([]);
  const [plants, setPlants] = useState<PlantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("watering");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRecurring, setNewRecurring] = useState("");
  const [newPlantId, setNewPlantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [weather, setWeather] = useState<WeatherInsight | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!user?.city || !user?.country) {
      setWeather(null);
      setWeatherError("location");
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch("/api/weather");
      const data = await res.json();
      if (res.ok) {
        setWeather(data);
      } else if (data.code === "LOCATION_REQUIRED") {
        setWeatherError("location");
      } else {
        setWeatherError("unavailable");
      }
    } catch {
      setWeatherError("unavailable");
    } finally {
      setWeatherLoading(false);
    }
  }, [user?.city, user?.country]);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPlants = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/plants");
    const data = await res.json();
    if (res.ok) setPlants(data.plants || []);
  }, [user]);

  useEffect(() => {
    fetchReminders();
    fetchPlants();
    fetchWeather();
  }, [fetchReminders, fetchPlants, fetchWeather]);

  useEffect(() => {
    setCurrentMonth(getCurrentCalendarMonth(locale));
  }, [locale]);

  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(getCurrentCalendarMonth(locale));
    setSelectedDate(today);
  };

  const days = getCalendarDays(currentMonth.year, currentMonth.month, locale);
  const weekdays = locale === "fa" ? WEEKDAYS_FA : WEEKDAYS_EN;

  const visibleReminders = reminders.filter((r) =>
    showCompleted ? r.completed : !r.completed
  );

  const getRemindersForDate = (date: Date) => {
    if (date.getTime() === 0) return [];
    return visibleReminders.filter((r) =>
      isSameCalendarDay(new Date(r.scheduledAt), date, locale)
    );
  };

  const selectedReminders = getRemindersForDate(selectedDate);
  const upcomingReminders = reminders
    .filter((r) => !r.completed && new Date(r.scheduledAt) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
    .slice(0, 5);

  const openAddModal = () => {
    setNewDate(getTodayString(locale));
    setShowAdd(true);
  };

  const addReminder = async () => {
    if (!newTitle.trim() || !newDate || !user) return;
    setSaving(true);
    try {
      const titleEn = newTitle.trim();
      const titleFa =
        locale === "fa" ? newTitle.trim() : getPersianName(newTitle.trim());

      const scheduledAt = parseInputDate(newDate, locale);

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn,
          titleFa,
          type: newType,
          scheduledAt: scheduledAt.toISOString(),
          plantId: newPlantId || null,
          recurring: newRecurring || null,
          notes: newNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminders((prev) => [...prev, data.reminder]);
        setShowAdd(false);
        setNewTitle("");
        setNewDate("");
        setNewNotes("");
        setNewRecurring("");
        setNewPlantId("");
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const res = await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed: !completed }),
    });
    const data = await res.json();
    if (res.ok) {
      setReminders((prev) => {
        let next = prev.map((r) => (r.id === id ? data.reminder : r));
        if (data.nextReminder) next = [...next, data.nextReminder];
        return next;
      });
    }
  };

  const deleteReminder = async (id: string) => {
    const res = await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const PrevIcon = direction === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = direction === "rtl" ? ChevronLeft : ChevronRight;

  const displayMonthYear = () => {
    const refDate =
      locale === "fa"
        ? new Date(
            toGregorian(currentMonth.year, currentMonth.month + 1, 1).gy,
            toGregorian(currentMonth.year, currentMonth.month + 1, 1).gm - 1,
            1
          )
        : new Date(currentMonth.year, currentMonth.month, 1);
    return formatRelativeMonthYear(refDate, locale);
  };

  const formatDayNumber = (date: Date) => {
    if (date.getTime() === 0) return "";
    if (locale === "fa") {
      return toPersianDigits(formatDate(date, locale, "d"));
    }
    return date.getDate().toString();
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">{t.calendar.title}</h1>
        <p className="text-muted-foreground mb-6">{t.calendar.subtitle}</p>
        <Link href="/auth/login" className="btn-primary">
          {t.nav.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t.calendar.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.calendar.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={goToToday} className="btn-secondary text-sm px-4 py-2">
            {t.calendar.today}
          </button>
          <button onClick={openAddModal} className="btn-primary text-sm px-4 py-2">
            <Plus className="w-4 h-4" />
            {t.calendar.addReminder}
          </button>
        </div>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
          <CloudSun className="w-5 h-5 text-sky-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{t.calendar.weatherTitle}</p>
          {weatherLoading ? (
            <p className="text-sm mt-1">{t.calendar.weatherLoading}</p>
          ) : weather ? (
            <>
              <p className="text-sm font-medium mt-1">
                {weather.location.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "fa"
                  ? weather.insight.summaryFa
                  : weather.insight.summaryEn}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t.calendar.weatherTemp}: {weather.insight.avgTempNext3Days}° ·{" "}
                {t.calendar.weatherRain}: {weather.insight.rainNext3DaysMm} mm ·{" "}
                {t.calendar.weatherHumidity}: {weather.insight.avgHumidityNext3Days}%
              </p>
            </>
          ) : (
            <p className="text-sm mt-1 text-muted-foreground">
              {weatherError === "location"
                ? t.calendar.weatherLocationRequired
                : t.calendar.weatherUnavailable}
            </p>
          )}
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 sm:max-w-[12rem]">
          {t.calendar.weatherWateringHint}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowCompleted(false)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            !showCompleted
              ? "bg-primary text-primary-foreground"
              : "glass hover:bg-accent"
          )}
        >
          {t.calendar.upcoming}
        </button>
        <button
          type="button"
          onClick={() => setShowCompleted(true)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            showCompleted
              ? "bg-primary text-primary-foreground"
              : "glass hover:bg-accent"
          )}
        >
          {t.calendar.completed}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <PrevIcon className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold">{displayMonthYear()}</h2>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
            >
              <NextIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (date.getTime() === 0) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const dayReminders = getRemindersForDate(date);
              const isSelected = isSameCalendarDay(date, selectedDate, locale);
              const isTodayDate = isToday(date, locale);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm transition-all relative min-h-[2.5rem]",
                    isSelected
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : isTodayDate
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "hover:bg-accent"
                  )}
                >
                  {formatDayNumber(date)}
                  {dayReminders.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayReminders.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isSelected ? "bg-white" : "bg-emerald-500",
                            r.completed && "opacity-40"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4 sm:p-5 animate-fade-in-delay-1">
            <h3 className="font-semibold mb-1">
              {formatDayOfWeek(selectedDate, locale)}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {formatDate(selectedDate, locale)}
            </p>

            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
            ) : selectedReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.calendar.noReminders}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedReminders.map((r) => {
                  const Icon = TYPE_ICONS[r.type] || Flower2;
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 p-3 rounded-xl glass",
                        r.completed && "opacity-50"
                      )}
                    >
                      <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {locale === "fa" ? r.titleFa : r.titleEn}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.calendar.types[r.type as keyof typeof t.calendar.types] ||
                            r.type}
                          {r.plant &&
                            ` · ${locale === "fa" ? r.plant.nameFa : r.plant.nameEn}`}
                        </p>
                      </div>
                      {!r.completed && (
                        <button
                          type="button"
                          onClick={() => toggleComplete(r.id, r.completed)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                          title={t.calendar.markDone}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteReminder(r.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!showCompleted && (
            <div className="glass-card p-4 sm:p-5 animate-fade-in-delay-2">
              <h3 className="font-semibold mb-3">{t.calendar.upcoming}</h3>
              {upcomingReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.calendar.noReminders}</p>
              ) : (
                <div className="space-y-2">
                  {upcomingReminders.map((r) => {
                    const Icon = TYPE_ICONS[r.type] || Flower2;
                    return (
                      <div key={r.id} className="flex items-center gap-3 text-sm">
                        <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="flex-1 truncate">
                          {locale === "fa" ? r.titleFa : r.titleEn}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(r.scheduledAt, locale)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card p-6 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{t.calendar.addReminder}</h3>
              <button type="button" onClick={() => setShowAdd(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t.calendar.reminderTitle}
                className="input-field"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="input-field"
              >
                {Object.entries(t.calendar.types).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={newPlantId}
                onChange={(e) => setNewPlantId(e.target.value)}
                className="input-field"
              >
                <option value="">{t.calendar.selectPlant}</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === "fa" ? p.nameFa : p.nameEn}
                  </option>
                ))}
              </select>
              <input
                type={locale === "en" ? "date" : "text"}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder={locale === "fa" ? "۱۴۰۵/۰۴/۱۶" : "2026-07-06"}
                className="input-field"
              />
              <select
                value={newRecurring}
                onChange={(e) => setNewRecurring(e.target.value)}
                className="input-field"
              >
                <option value="">{t.calendar.recurring}</option>
                <option value="daily">{t.calendar.daily}</option>
                <option value="weekly">{t.calendar.weekly}</option>
                <option value="monthly">{t.calendar.monthly}</option>
              </select>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t.calendar.notes}
                className="input-field resize-none"
                rows={2}
              />
              <button
                type="button"
                onClick={addReminder}
                disabled={saving || !newTitle.trim() || !newDate}
                className="btn-primary w-full"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.calendar.save
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
