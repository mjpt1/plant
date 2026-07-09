import { NextResponse } from "next/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/web-push-server";

export async function GET() {
  if (!isWebPushConfigured()) {
    return NextResponse.json({ configured: false }, { status: 404 });
  }

  return NextResponse.json({
    configured: true,
    publicKey: getVapidPublicKey(),
  });
}
