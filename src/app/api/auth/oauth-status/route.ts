import { NextResponse } from "next/server";
import { getOAuthEnvStatus, OAUTH_PROVIDER_IDS } from "@/lib/oauth/build-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = getOAuthEnvStatus();

  return NextResponse.json({
    providers: OAUTH_PROVIDER_IDS.map((id) => ({
      id,
      configured: configured[id],
    })),
  });
}
