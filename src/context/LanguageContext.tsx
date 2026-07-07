"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTranslations, type Locale, type TranslationKeys } from "@/i18n";
import {
  getDirection,
  persistClientLocale,
  readClientLocale,
} from "@/lib/locale";

interface LanguageContextValue {
  locale: Locale;
  direction: "ltr" | "rtl";
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = readClientLocale();
    if (stored !== initialLocale) {
      setLocaleState(stored);
    }
  }, [initialLocale]);

  useEffect(() => {
    persistClientLocale(locale);
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === "en" ? "fa" : "en"));
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      direction: getDirection(locale),
      t: getTranslations(locale),
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
