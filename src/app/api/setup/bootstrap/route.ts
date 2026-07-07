import { NextRequest, NextResponse } from "next/server";
import { bootstrapDemoUsers, checkDatabaseConnection } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json(
      { error: "SETUP_SECRET is not configured on the server." },
      { status: 503 }
    );
  }

  const provided =
    request.headers.get("x-setup-secret") ||
    new URL(request.url).searchParams.get("secret");

  if (!provided || provided !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkDatabaseConnection();
    const users = await bootstrapDemoUsers();

    return NextResponse.json({
      ok: true,
      message: "Demo users are ready.",
      users,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Bootstrap failed",
      },
      { status: 500 }
    );
  }
}
