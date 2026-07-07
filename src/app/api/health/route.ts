import { NextResponse } from "next/server";
import { resolveAppUrl } from "@/lib/app-url";
import { checkDatabaseConnection } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean | string> = {
    appUrl: resolveAppUrl(),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    isVercel: !!process.env.VERCEL,
  };

  let database = false;
  let databaseError: string | undefined;
  let userCount: number | undefined;

  if (process.env.DATABASE_URL) {
    try {
      await checkDatabaseConnection();
      database = true;
      userCount = await prisma.user.count();
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : "Database connection failed";
    }
  }

  checks.database = database;
  if (typeof userCount === "number") {
    checks.userCount = userCount;
    checks.demoUsersReady = userCount >= 3;
  }
  if (databaseError) checks.databaseError = databaseError;

  const ok =
    checks.hasDatabaseUrl === true &&
    checks.hasNextAuthSecret === true &&
    database === true &&
    (typeof userCount !== "number" || userCount >= 1);

  return NextResponse.json(
    {
      ok,
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}
