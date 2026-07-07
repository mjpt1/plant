import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadImageBuffer, uploadBase64Image, isCloudinaryConfigured } from "@/lib/cloudinary";
import { apiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Set CLOUDINARY_* env variables." },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const folder = `plantcare/${user.id}`;
      const uploaded = await uploadImageBuffer(buffer, folder);
      return NextResponse.json(uploaded);
    }

    const body = await request.json();
    const { image } = body;
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image data required" }, { status: 400 });
    }

    const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
    const folder = `plantcare/${user.id}`;
    const uploaded = await uploadBase64Image(dataUrl, folder);
    return NextResponse.json(uploaded);
  } catch (error) {
    return apiError(error);
  }
}
