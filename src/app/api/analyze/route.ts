import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { analyzePlantImage, isDemoAiMode } from "@/lib/ai-analyze";
import { ApiError, apiError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth";
import { parseLocale, LOCALE_COOKIE_NAME } from "@/lib/locale";
import {
  fileToValidatedBuffer,
  parseBase64ImagePayload,
} from "@/lib/image-validation";
import { saveScanResult, uploadScanImage } from "@/lib/scan-service";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeLocaleSchema, analyzeResponseSchema } from "@/types/analyze-api";
import { imageScanTypeSchema } from "@/types/analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const ANALYZE_LIMIT = 10;
const ANALYZE_WINDOW_MS = 60 * 60 * 1000;

function resolveLocale(
  localeField: unknown,
  cookieLocale: string | undefined
): "en" | "fa" {
  const fromField = analyzeLocaleSchema.safeParse(localeField);
  if (fromField.success) return fromField.data;

  const fromCookie = parseLocale(cookieLocale);
  if (fromCookie) return fromCookie;

  return "fa";
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = rateLimit(`analyze:${user.id}`, ANALYZE_LIMIT, ANALYZE_WINDOW_MS);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many scan requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const cookieLocale = cookies().get(LOCALE_COOKIE_NAME)?.value;
    const contentType = request.headers.get("content-type") || "";

    let buffer: Buffer;
    let base64: string;
    let mimeType: string;
    let imageType: string | undefined;
    let locale: "en" | "fa";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No image file provided" }, { status: 400 });
      }

      try {
        const validated = await fileToValidatedBuffer(file);
        buffer = validated.buffer;
        base64 = validated.base64;
        mimeType = validated.mimeType;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid image file";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const typeField = formData.get("imageType");
      if (typeof typeField === "string" && typeField.length > 0) {
        imageType = typeField;
      }

      locale = resolveLocale(formData.get("locale"), cookieLocale);
    } else {
      let body: Record<string, unknown>;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const imagePayload = body.image;
      if (typeof imagePayload !== "string" || !imagePayload.trim()) {
        return NextResponse.json({ error: "No image data provided" }, { status: 400 });
      }

      try {
        const validated = parseBase64ImagePayload(
          imagePayload,
          typeof body.mimeType === "string" ? body.mimeType : undefined
        );
        buffer = validated.buffer;
        base64 = validated.base64;
        mimeType = validated.mimeType;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid image data";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      if (typeof body.imageType === "string" && body.imageType.length > 0) {
        imageType = body.imageType;
      }

      locale = resolveLocale(body.locale, cookieLocale);
    }

    if (imageType) {
      const parsedType = imageScanTypeSchema.safeParse(imageType);
      if (!parsedType.success) {
        return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
      }
      imageType = parsedType.data;
    }

    const storedImageUrl = await uploadScanImage(buffer, mimeType, base64, user.id);

    const analysis = await analyzePlantImage(base64, mimeType, {
      imageType,
      locale,
    });

    const scan = await saveScanResult({
      userId: user.id,
      imageUrl: storedImageUrl,
      imageType,
      analysis,
    });

    const responseImageUrl =
      storedImageUrl.startsWith("http://") || storedImageUrl.startsWith("https://")
        ? storedImageUrl
        : "";

    const response = analyzeResponseSchema.parse({
      success: true,
      data: analysis,
      imageUrl: responseImageUrl,
      scanId: scan.id,
      locale,
      demo: isDemoAiMode(),
      confidence: {
        plant: analysis.plant.confidence,
        health: analysis.health.confidence,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Cloudinary")) {
        return apiError(new ApiError(error.message, 503));
      }
      if (error.message.includes("API error")) {
        return apiError(new ApiError("Plant analysis failed. Please try again.", 502));
      }
    }
    return apiError(error);
  }
}
