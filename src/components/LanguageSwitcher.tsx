"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherVariant = "icon" | "buttons";

interface LanguageSwitcherProps {
  variant?: LanguageSwitcherVariant;
  className?: string;
  disabled?: boolean;
}

export function LanguageSwitcher({
  variant = "icon",
  className,
  disabled = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, toggleLocale, t } = useLanguage();

  if (variant === "buttons") {
    const options: { value: Locale; label: string }[] = [
      { value: "en", label: t.language.en },
      { value: "fa", label: t.language.fa },
    ];

    return (
      <div
        className={cn("inline-flex rounded-xl border bg-muted/40 p-1", className)}
        role="group"
        aria-label={t.language.switchTo}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => setLocale(option.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              locale === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={locale === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggleLocale}
      className={cn(
        "p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300",
        className
      )}
      aria-label={t.language.switchTo}
      title={locale === "en" ? t.language.fa : t.language.en}
    >
      <Globe className="w-5 h-5" />
      <span className="sr-only">
        {locale === "en" ? t.language.fa : t.language.en}
      </span>
    </button>
  );
}
