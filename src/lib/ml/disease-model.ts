/**
 * Phase-2 stub: dedicated plant-disease CNN endpoint.
 * When DISEASE_MODEL_URL is set, POST image bytes and merge top labels.
 */

export type DiseaseModelPrediction = {
  label: string;
  score: number;
};

export type DiseaseModelResult = {
  configured: boolean;
  used: boolean;
  labels: DiseaseModelPrediction[];
  raw?: unknown;
};

export function isDiseaseModelConfigured(): boolean {
  return !!process.env.DISEASE_MODEL_URL?.trim();
}

export async function predictDiseaseFromImage(
  base64Image: string,
  mimeType: string,
  options?: { scientificName?: string; imageType?: string }
): Promise<DiseaseModelResult> {
  const url = process.env.DISEASE_MODEL_URL?.trim();
  if (!url) {
    return { configured: false, used: false, labels: [] };
  }

  const threshold = parseFloat(process.env.DISEASE_MODEL_THRESHOLD || "0.45");
  const apiKey = process.env.DISEASE_MODEL_API_KEY;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType,
        scientificName: options?.scientificName,
        imageType: options?.imageType,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      return { configured: true, used: false, labels: [] };
    }

    const data = (await response.json()) as {
      labels?: { label?: string; score?: number }[];
      predictions?: { label?: string; score?: number }[];
    };

    const rawList = data.labels || data.predictions || [];
    const labels = rawList
      .map((item) => ({
        label: String(item.label || "").trim(),
        score: Number(item.score) || 0,
      }))
      .filter((item) => item.label && item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      configured: true,
      used: labels.length > 0,
      labels,
      raw: data,
    };
  } catch {
    return { configured: true, used: false, labels: [] };
  }
}
