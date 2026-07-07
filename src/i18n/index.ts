import { en, type TranslationKeys } from "./translations/en";
import { fa } from "./translations/fa";

export type Locale = "en" | "fa";

const translations: Record<Locale, TranslationKeys> = { en, fa };

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale];
}

export { en, fa };
export type { TranslationKeys };
