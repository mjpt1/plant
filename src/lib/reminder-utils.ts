export function getNextRecurringDate(
  from: Date,
  recurring: string
): Date {
  const next = new Date(from);

  switch (recurring) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}

export function getPlantActivityField(
  type: string
): "lastWateredAt" | "lastFertilizedAt" | null {
  if (type === "watering") return "lastWateredAt";
  if (type === "fertilizing") return "lastFertilizedAt";
  return null;
}
