# گیاه‌یار | PlantCare

![گیاه‌یار PlantCare](./public/images/social-cover.png)

A production-ready Progressive Web App for plant identification, health checks, Q&A forum, social network, and care calendar — with full Persian (RTL/Jalali) and English (LTR/Gregorian) support.

## Features

- **Plant Scanner** — Camera or upload with instant species and health insights
- **Health & Disease Check** — Status, treatment steps, prevention tips, soil and moisture notes
- **Social Feed** — Posts, likes, comments, follow users
- **Q&A Forum** — Ask questions by category (soil, pest, watering, disease)
- **Care Calendar** — Jalali calendar (fa) / Gregorian calendar (en) with reminders
- **Plant Library** — 2,000+ species catalog with bilingual names
- **i18n** — Persian (RTL) and English (LTR) with language switcher
- **Dark/Light Mode** — System-aware theme toggle
- **PWA** — Installable with service worker caching

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + glassmorphic UI
- Prisma ORM + PostgreSQL
- NextAuth (credentials + OAuth)
- Cloudinary image uploads
- date-fns-jalali + jalaali-js for dual calendar

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

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

### 3. Start PostgreSQL

```bash
docker compose up -d
```

Database runs on **port 5433** to avoid conflicts with a local Postgres on 5432.

### 4. Set up database & catalog

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

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `demo@plantcare.ir` | `demo1234` |
| Admin | `admin@plantcare.ir` | `admin1234` |
| Expert | `expert@plantcare.ir` | `expert1234` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run dev:clean` | Clear `.next` cache and start dev |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run setup` | DB push + catalog + seed |

## Repository Cover

Use `public/images/social-cover.png` as the GitHub repository social preview image (Settings → General → Social preview).

## License

MIT
