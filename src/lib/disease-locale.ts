/** Map common English disease/pest/CNN labels to Persian for FA UI. */

const DISEASE_FA: Record<string, string> = {
  "powdery mildew": "سفیدک پودری",
  "downy mildew": "سفیدک دروغین",
  "leaf spot": "لکه برگی",
  "leaf spots": "لکه برگی",
  "bacterial leaf spot": "لکه باکتریایی برگ",
  "fungal leaf spot": "لکه قارچی برگ",
  "anthracnose": "آنتراکنوز",
  "rust": "زنگ",
  "leaf rust": "زنگ برگ",
  "root rot": "پوسیدگی ریشه",
  "crown rot": "پوسیدگی طوقه",
  "stem rot": "پوسیدگی ساقه",
  "black rot": "پوسیدگی سیاه",
  "soft rot": "پوسیدگی نرم",
  "botrytis": "کپک خاکستری (بوتریلیس)",
  "gray mold": "کپک خاکستری",
  "grey mould": "کپک خاکستری",
  "sooty mold": "کپک دوده‌ای",
  "mosaic virus": "ویروس موزائیک",
  "tobacco mosaic": "موزائیک توتون",
  "blight": "سوختگی/بلایت",
  "early blight": "سوختگی زودرس",
  "late blight": "سوختگی دیررس",
  "fusarium wilt": "پژمردگی فوزاریومی",
  "verticillium wilt": "پژمردگی ورتیسیلیومی",
  "damping off": "مرگ گیاهچه",
  "canker": "شانکر",
  "scab": "جرب",
  "chlorosis": "کلروز (زردی)",
  "necrosis": "نکروز",
  "edema": "ادم (تورم سلولی)",
  oedema: "ادم (تورم سلولی)",
  "sunburn": "سوختگی آفتاب",
  "leaf scorch": "سوختگی لبه برگ",
  "nutrient deficiency": "کمبود عناصر غذایی",
  "nitrogen deficiency": "کمبود نیتروژن",
  "iron deficiency": "کمبود آهن",
  "magnesium deficiency": "کمبود منیزیم",
  "potassium deficiency": "کمبود پتاسیم",
  "calcium deficiency": "کمبود کلسیم",
  "phosphorus deficiency": "کمبود فسفر",
  aphids: "شته",
  aphid: "شته",
  "spider mites": "کنه تار عنکبوتی",
  "spider mite": "کنه تار عنکبوتی",
  mealybugs: "شپشک آردی",
  mealybug: "شپشک آردی",
  "scale insects": "شپشک سپردار",
  scale: "شپشک سپردار",
  thrips: "تریپس",
  "whiteflies": "مگس سفید",
  whitefly: "مگس سفید",
  "fungus gnats": "پشه قارچ",
  "fungus gnat": "پشه قارچ",
  "leaf miners": "مینوز برگ",
  caterpillars: "لارو/کرم برگ‌خوار",
  snails: "حلزون",
  slugs: "لیسه",
  "bacterial ooze": "ترشح باکتریایی",
  "viral infection": "عفونت ویروسی",
  "fungal infection": "عفونت قارچی",
  healthy: "سالم",
  unknown: "نامشخص",
};

const TREATMENT_FA: [string, string][] = [
  ["isolate the plant", "گیاه را جدا کنید"],
  ["remove affected leaves", "برگ‌های آسیب‌دیده را جدا کنید"],
  ["sanitize pruning tools", "ابزار هرس را ضدعفونی کنید"],
  ["improve air circulation", "تهویه را بهتر کنید"],
  ["reduce watering", "آبیاری را کم کنید"],
  ["increase watering", "آبیاری را بیشتر کنید"],
  ["repot with fresh soil", "با خاک تازه تعویض گلدان کنید"],
  ["use neem oil", "از روغن چریش استفاده کنید"],
  ["insecticidal soap", "صابون حشره‌کش"],
  ["fungicide", "قارچ‌کش"],
  ["copper fungicide", "قارچ‌کش مسی (مثل بردوفیکس)"],
  ["systemic insecticide", "حشره‌کش سیستمیک (مثل کنفیدور)"],
  ["hydrogen peroxide", "آب‌اکسیژنه رقیق"],
  ["wipe leaves", "برگ‌ها را با پارچه مرطوب پاک کنید"],
  ["quarantine", "قرنطینه کنید"],
  ["check drainage", "زهکشی گلدان را بررسی کنید"],
  ["avoid wetting leaves", "از خیس شدن برگ‌ها پرهیز کنید"],
  ["move to brighter light", "به نور روشن‌تر منتقل کنید"],
  ["move away from direct sun", "از آفتاب مستقیم دور کنید"],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PERSIAN_CHAR = /[\u0600-\u06FF]/;

export function isMostlyPersian(text: string): boolean {
  const letters = text.replace(/[\s\d.,;:!?\-—()'%/]/g, "");
  if (!letters.length) return false;
  const fa = (letters.match(new RegExp(PERSIAN_CHAR.source, "g")) || []).length;
  return fa / letters.length > 0.35;
}

/** Localize a single disease/pest/problem label for FA locale. */
export function localizeDiseaseLabel(label: string, locale: "en" | "fa"): string {
  const trimmed = label.trim();
  if (!trimmed || locale === "en") return trimmed;
  if (isMostlyPersian(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (DISEASE_FA[lower]) return DISEASE_FA[lower];

  for (const [en, fa] of Object.entries(DISEASE_FA).sort(
    (a, b) => b[0].length - a[0].length
  )) {
    if (lower.includes(en)) {
      return trimmed.replace(new RegExp(escapeRegExp(en), "gi"), fa);
    }
  }

  let out = trimmed;
  for (const [en, fa] of TREATMENT_FA.sort((a, b) => b[0].length - a[0].length)) {
    out = out.replace(new RegExp(escapeRegExp(en), "gi"), fa);
  }
  if (!isMostlyPersian(out) && /[A-Za-z]{4,}/.test(out)) {
    return `مورد تشخیص‌داده‌شده (${out})`;
  }
  return out;
}

export function localizeDiseaseLabels(
  labels: string[],
  locale: "en" | "fa"
): string[] {
  return labels
    .map((l) => localizeDiseaseLabel(l, locale))
    .filter(Boolean);
}

/** Iranian-market treatment hints keyed by disease/pest keywords. */
export function localProductHintsForLabels(
  labels: string[],
  locale: "en" | "fa"
): string[] {
  const joined = labels.join(" ").toLowerCase();
  const fa = locale === "fa";
  const hints: string[] = [];

  if (/mildew|سفیدک|powdery/.test(joined)) {
    hints.push(
      fa
        ? "قارچ‌کش مسی (بردوفیکس) یا گوگرد — تهویه را افزایش دهید."
        : "Copper fungicide (Bordeaux) or sulfur — improve airflow."
    );
  }
  if (/rot|پوسیدگی|root/.test(joined)) {
    hints.push(
      fa
        ? "آبیاری را کم کنید، خاک را عوض کنید، زهکشی را بررسی کنید."
        : "Cut watering, refresh soil, check drainage."
    );
  }
  if (/aphid|شته|mealy|شپشک|mite|کنه|thrips|تریپس|whitefly|مگس/.test(joined)) {
    hints.push(
      fa
        ? "صابون حشره‌کش یا روغن چریش؛ در آلودگی شدید کنفیدور (با احتیاط)."
        : "Insecticidal soap or neem; systemic insecticide only if severe."
    );
  }
  if (/spot|لکه|anthracnose|آنتراکنوز|rust|زنگ/.test(joined)) {
    hints.push(
      fa
        ? "برگ‌های آلوده را جدا کنید؛ از خیس شدن برگ هنگام آبیاری بپرهیزید."
        : "Remove affected leaves; avoid wetting foliage when watering."
    );
  }
  if (/iron|آهن|chlorosis|کلروز|yellow/.test(joined)) {
    hints.push(
      fa
        ? "کود آهن کلاته و بررسی pH خاک را در نظر بگیرید."
        : "Consider chelated iron and soil pH check."
    );
  }

  return hints.slice(0, 3);
}
