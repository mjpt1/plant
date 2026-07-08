export type PlantNetIdentification = {
  scientificName: string;
  scientificNameWithAuthor: string;
  family: string | null;
  commonNameEn: string | null;
  score: number;
  rejected: boolean;
};

function mapScanTypeToOrgan(imageType?: string): string {
  switch (imageType) {
    case "leaf":
      return "leaf";
    case "flower":
      return "flower";
    case "fruit":
      return "fruit";
    case "stem":
      return "bark";
    case "root":
      return "root";
    default:
      return "auto";
  }
}

export function getPlantNetApiKey(): string | undefined {
  return process.env.PLANTNET_API_KEY || process.env.ANALYSIS_PLANTNET_KEY;
}

export async function identifyWithPlantNet(
  buffer: Buffer,
  mimeType: string,
  imageType?: string
): Promise<PlantNetIdentification | null> {
  const apiKey = getPlantNetApiKey();
  if (!apiKey) return null;

  const project = process.env.PLANTNET_PROJECT || "all";
  const organ = mapScanTypeToOrgan(imageType);
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  form.append("images", blob, `scan.${extension}`);
  form.append("organs", organ);

  const url = new URL(`https://my-api.plantnet.org/v2/identify/${project}`);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString(), {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PlantNet error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    bestMatch?: string;
    results?: Array<{
      score?: number;
      species?: {
        scientificNameWithoutAuthor?: string;
        scientificName?: string;
        family?: { scientificName?: string };
        commonNames?: string[];
      };
    }>;
  };

  const top = data.results?.[0];
  const scientificNameWithAuthor =
    data.bestMatch ||
    top?.species?.scientificName ||
    top?.species?.scientificNameWithoutAuthor ||
    "";
  const scientificName =
    top?.species?.scientificNameWithoutAuthor ||
    scientificNameWithAuthor.split(" ").slice(0, 2).join(" ");
  const score = top?.score ?? 0;

  if (!scientificName || score < 0.05) {
    return {
      scientificName: "",
      scientificNameWithAuthor: scientificNameWithAuthor || "",
      family: top?.species?.family?.scientificName || null,
      commonNameEn: top?.species?.commonNames?.[0] || null,
      score,
      rejected: true,
    };
  }

  return {
    scientificName,
    scientificNameWithAuthor,
    family: top?.species?.family?.scientificName || null,
    commonNameEn: top?.species?.commonNames?.[0] || null,
    score,
    rejected: false,
  };
}
