/**
 * Resolve the public app URL on Vercel and locally.
 * NextAuth needs NEXTAUTH_URL; Vercel does not set it automatically.
 */
export function resolveAppUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function ensureAuthEnv(): void {
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = resolveAppUrl();
  }
}
