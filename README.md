# گیاه‌یار

[![GitHub](https://img.shields.io/github/stars/mjpt1/plant?style=social)](https://github.com/mjpt1/plant)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://plant-two-psi.vercel.app)

![گیاه‌یار](./public/images/social-cover.png)

**مخزن:** [github.com/mjpt1/plant](https://github.com/mjpt1/plant) · **نسخه زنده:** [plant-two-psi.vercel.app](https://plant-two-psi.vercel.app)

**فارسی** · اپلیکیشن وب پیشرفته برای شناسایی گیاه، بررسی سلامت، انجمن پرسش‌وپاسخ، شبکه اجتماعی و تقویم مراقبت — با پشتیبانی کامل از فارسی (راست‌به‌چپ/جلالی) و انگلیسی (چپ‌به‌راست/میلادی).

**English** · A production-ready Progressive Web App for plant identification, health checks, Q&A forum, social network, and care calendar — with full Persian (RTL/Jalali) and English (LTR/Gregorian) support.

---

## فارسی

### امکانات

- **اسکنر گیاه** — عکس با دوربین یا آپلود، با نتیجه فوری برای گونه و سلامت
- **بررسی سلامت و بیماری** — وضعیت، مراحل درمان، نکات پیشگیری، تحلیل خاک و رطوبت
- **فید اجتماعی** — پست، لایک، نظر و دنبال‌کردن کاربران
- **انجمن پرسش‌وپاسخ** — پرسش در دسته‌های خاک، آفت، آبیاری و بیماری
- **تقویم مراقبت** — تقویم جلالی (فا) / میلادی (انگلیسی) با یادآور
- **کتابخانه گیاهان** — کاتالوگ بیش از ۲۶٬۰۰۰ گونه (WCVP/Kew، PlantSolve، Bripatch، netplant، IMP)
- **چندزبانه** — فارسی و انگلیسی با تعویض زبان
- **حالت تاریک/روشن** — تم هماهنگ با سیستم
- **PWA** — قابل نصب با کش سرویس‌ورکر

### فناوری‌ها

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + رابط شیشه‌ای
- Prisma ORM + PostgreSQL
- NextAuth (ورود با رمز / OAuth)
- Cloudinary برای آپلود تصویر
- date-fns-jalali + jalaali-js برای تقویم دوگانه

### راه‌اندازی

#### ۱. نصب وابستگی‌ها

```bash
npm install
```

#### ۲. تنظیم محیط

```bash
cp .env.example .env
```

| متغیر | توضیح |
|-------|--------|
| `DATABASE_URL` | رشته اتصال PostgreSQL (پورت **۵۴۳۳** با Docker) |
| `NEXTAUTH_URL` | آدرس اپ (مثلاً `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | کلید تصادفی برای نشست JWT |
| `ANALYSIS_PROVIDER` | `primary` یا `fallback` |
| `ANALYSIS_PRIMARY_KEY` | کلید اصلی سرویس تحلیل تصویر |
| `ANALYSIS_FALLBACK_KEY` | کلید ثانویه (اختیاری) |
| `CLOUDINARY_*` | آپلود تصویر (اختیاری) |
| `GOOGLE_*` / `GITHUB_*` | ورود OAuth (اختیاری) |

#### ۳. اجرای PostgreSQL

```bash
docker compose up -d
```

پایگاه داده روی پورت **۵۴۳۳** اجرا می‌شود تا با Postgres محلی روی ۵۴۳۲ تداخل نداشته باشد.

#### ۴. راه‌اندازی پایگاه داده و کاتالوگ

```bash
npm run setup
```

یا مرحله‌به‌مرحله:

```bash
npm run db:push
npm run catalog:seed
npm run catalog:fix-fa
npm run db:seed
```

#### ۵. اجرای سرور توسعه

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) را باز کنید.

### حساب‌های دمو

| نقش | ایمیل | رمز |
|-----|-------|-----|
| کاربر | `demo@plantcare.ir` | `demo1234` |
| مدیر | `admin@plantcare.ir` | `admin1234` |
| کارشناس | `expert@plantcare.ir` | `expert1234` |

### اسکریپت‌ها

| دستور | توضیح |
|-------|--------|
| `npm run dev` | اجرای سرور توسعه |
| `npm run dev:clean` | پاک‌کردن کش `.next` و اجرای dev |
| `npm run build` | بیلد production |
| `npm run test` | تست واحد (Vitest) |
| `npm run test:e2e` | تست end-to-end (Playwright) |
| `npm run setup` | db:push + کاتالوگ + seed |
| `npm run catalog:import` | دانلود و ادغام داده از WCVP، PlantSolve، Bripatch، netplant، IMP |
| `npm run catalog:seed` | بارگذاری `plant-catalog.json` در دیتابیس |
| `npm run catalog:seed:force` | بازسازی کامل کاتالوگ از JSON |

### منابع داده کاتالوگ

| منبع | نقش |
|------|-----|
| [WCVP / Kew](https://sftp.kew.org/pub/data-repositories/WCVP/) | جایگزین The Plant List — ~۲۵٬۰۰۰ گونه پذیرفته‌شده |
| [IPNI](https://www.ipni.org/) | فهرست بین‌المللی نام‌های گیاهان (در WCVP ادغام شده) |
| [PlantSolve](https://www.plantsolve.com/) | ۱۱۳ گیاه آپارتمانی با راهنمای مراقبت |
| [Bripatch](https://github.com/bripatch/plant-variety-database) | ~۲٬۰۰۰ گونه باغبانی |
| [netplant.ir](https://www.netplant.ir/) | نام‌های فارسی و داده اکولوژیک ایران |
| [imp.ac.ir](http://imp.ac.ir/IMP/Home/Plant) | گیاهان دارویی ایران |
| [MMPND](https://en.wikipedia.org/wiki/Multilingual_Multiscript_Plant_Name_Database) | نام‌های چندزبانه (مرجع) |

### استقرار روی Vercel

۱. مخزن را در [Vercel](https://vercel.com) به GitHub وصل کنید (`mjpt1/plant`).

۲. **Storage → Postgres** (یا Neon/Supabase) را به پروژه وصل کنید تا `DATABASE_URL` تنظیم شود.

۳. در **Settings → Environment Variables** این مقادیر را اضافه کنید:

| متغیر | مقدار |
|-------|--------|
| `NEXTAUTH_SECRET` | یک رشته تصادفی طولانی (مثلاً `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | آدرس production مثل `https://your-app.vercel.app` |
| `SETUP_SECRET` | رمز یک‌بارمصرف برای ساخت حساب‌های دمو |

۴. **Deploy** کنید (یا Redeploy).

۵. وضعیت را بررسی کنید: `https://your-app.vercel.app/api/health`

۶. اگر `userCount` صفر است، حساب‌های دمو را بسازید:

```bash
curl -X POST "https://your-app.vercel.app/api/setup/bootstrap" -H "x-setup-secret: YOUR_SETUP_SECRET"
```

۷. با `demo@plantcare.ir` / `demo1234` وارد شوید.

**علت رایج خطای ورود:** نبود `DATABASE_URL`، نبود `NEXTAUTH_SECRET`، `NEXTAUTH_URL` اشتباه، یا seed نشدن پایگاه داده.

### تصویر شاخص مخزن

فایل `public/images/social-cover.png` را در GitHub به‌عنوان تصویر پیش‌نمایش اجتماعی قرار دهید (Settings → General → Social preview).

---

## English

### Features

- **Plant Scanner** — Camera or upload with instant species and health insights
- **Health & Disease Check** — Status, treatment steps, prevention tips, soil and moisture notes
- **Social Feed** — Posts, likes, comments, follow users
- **Q&A Forum** — Ask questions by category (soil, pest, watering, disease)
- **Care Calendar** — Jalali calendar (fa) / Gregorian calendar (en) with reminders
- **Plant Library** — 26,000+ species catalog (WCVP/Kew, PlantSolve, Bripatch, netplant.ir, imp.ac.ir)
- **i18n** — Persian (RTL) and English (LTR) with language switcher
- **Dark/Light Mode** — System-aware theme toggle
- **PWA** — Installable with service worker caching

### Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + glassmorphic UI
- Prisma ORM + PostgreSQL
- NextAuth (credentials + OAuth)
- Cloudinary image uploads
- date-fns-jalali + jalaali-js for dual calendar

### Getting Started

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (port **5433** via Docker) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for JWT sessions |
| `ANALYSIS_PROVIDER` | `primary` or `fallback` |
| `ANALYSIS_PRIMARY_KEY` | Primary image analysis service key |
| `ANALYSIS_FALLBACK_KEY` | Optional secondary service key |
| `CLOUDINARY_*` | Image uploads (optional) |
| `GOOGLE_*` / `GITHUB_*` | OAuth providers (optional) |

#### 3. Start PostgreSQL

```bash
docker compose up -d
```

Database runs on **port 5433** to avoid conflicts with a local Postgres on 5432.

#### 4. Set up database & catalog

```bash
npm run setup
```

Or step by step:

```bash
npm run db:push
npm run catalog:seed
npm run catalog:fix-fa
npm run db:seed
```

#### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `demo@plantcare.ir` | `demo1234` |
| Admin | `admin@plantcare.ir` | `admin1234` |
| Expert | `expert@plantcare.ir` | `expert1234` |

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run dev:clean` | Clear `.next` cache and start dev |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run setup` | DB push + catalog + seed |

### Deploy on Vercel

1. Import the GitHub repo (`mjpt1/plant`) on [Vercel](https://vercel.com).

2. Attach **Storage → Postgres** (or Neon/Supabase) so `DATABASE_URL` is set.

3. Add these in **Settings → Environment Variables**:

| Variable | Value |
|----------|--------|
| `NEXTAUTH_SECRET` | Long random string |
| `NEXTAUTH_URL` | Production URL, e.g. `https://your-app.vercel.app` |
| `SETUP_SECRET` | One-time secret for demo user bootstrap |

4. **Deploy** (or Redeploy).

5. Check: `https://your-app.vercel.app/api/health`

6. If `userCount` is 0, bootstrap demo users:

```bash
curl -X POST "https://your-app.vercel.app/api/setup/bootstrap" -H "x-setup-secret: YOUR_SETUP_SECRET"
```

7. Sign in with `demo@plantcare.ir` / `demo1234`.

**Common login failures:** missing `DATABASE_URL`, missing `NEXTAUTH_SECRET`, wrong `NEXTAUTH_URL`, or database not seeded.

### حمایت / GitHub Sponsors

اگر این پروژه برایتان مفید بود، می‌توانید از طریق [GitHub Sponsors](https://github.com/sponsors/mjpt1) از توسعهٔ آن حمایت کنید.

### Repository Cover

Use `public/images/social-cover.png` as the GitHub repository social preview image (Settings → General → Social preview).

---

## License / مجوز

MIT
