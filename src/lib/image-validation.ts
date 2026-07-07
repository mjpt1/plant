const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isAllowedImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function validateImageFile(file: File): void {
  if (!file.type || !isAllowedImageMimeType(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be under 10MB");
  }

  if (file.size === 0) {
    throw new Error("Image file is empty");
  }
}

export function validateImageBuffer(buffer: Buffer, mimeType: string): void {
  if (!buffer.length) {
    throw new Error("Image data is empty");
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image must be under 10MB");
  }

  if (!isAllowedImageMimeType(mimeType)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }
}

export async function fileToValidatedBuffer(file: File): Promise<{
  buffer: Buffer;
  mimeType: string;
  base64: string;
}> {
  validateImageFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  validateImageBuffer(buffer, file.type);

  return {
    buffer,
    mimeType: file.type,
    base64: buffer.toString("base64"),
  };
}

export function parseBase64ImagePayload(
  base64: string,
  mimeType?: string
): { buffer: Buffer; mimeType: string; base64: string } {
  let raw = base64.trim();
  let resolvedMime = mimeType || "image/jpeg";

  if (raw.includes(",")) {
    const [header, data] = raw.split(",", 2);
    raw = data;
    const match = header.match(/data:(.*?);/);
    if (match?.[1]) resolvedMime = match[1];
  }

  const buffer = Buffer.from(raw, "base64");
  validateImageBuffer(buffer, resolvedMime);

  return {
    buffer,
    mimeType: resolvedMime,
    base64: raw,
  };
}
