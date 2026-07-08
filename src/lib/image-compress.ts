const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

export function isPersistedImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

export function isInlineScanImageUrl(url?: string | null): boolean {
  return !!url && url.startsWith("inline:");
}

export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 1280,
  quality = 0.82
): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  if (typeof window === "undefined") {
    const [header, base64] = dataUrl.includes(",")
      ? dataUrl.split(",", 2)
      : ["", dataUrl];
    const mimeMatch = header.match(/data:(.*?);/);
    return {
      base64,
      mimeType: mimeMatch?.[1] || "image/jpeg",
      dataUrl,
    };
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      let width = image.width;
      let height = image.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not prepare image canvas"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);

      let nextQuality = quality;
      let output = canvas.toDataURL("image/jpeg", nextQuality);

      while (output.length > MAX_UPLOAD_BYTES * 1.37 && nextQuality > 0.45) {
        nextQuality -= 0.08;
        output = canvas.toDataURL("image/jpeg", nextQuality);
      }

      const [, base64] = output.split(",", 2);
      resolve({
        base64,
        mimeType: "image/jpeg",
        dataUrl: output,
      });
    };
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = dataUrl;
  });
}
