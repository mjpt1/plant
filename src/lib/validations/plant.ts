import { z } from "zod";

export const plantSchema = z.object({
  nameEn: z.string().min(1).max(120),
  nameFa: z.string().min(1).max(120),
  scientificName: z.string().max(160).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  healthStatus: z.enum(["healthy", "warning", "critical"]).default("healthy"),
  environment: z.enum(["indoor", "outdoor", "greenhouse", "balcony"]).default("indoor"),
  notes: z.string().max(2000).optional().nullable(),
  catalogId: z.string().optional().nullable(),
  careGuide: z.record(z.unknown()).optional().nullable(),
  generateSchedule: z.boolean().optional().default(true),
});

export const plantUpdateSchema = z
  .object({
    nameEn: z.string().min(1).max(120).optional(),
    nameFa: z.string().min(1).max(120).optional(),
    scientificName: z.string().max(160).optional().nullable(),
    imageUrl: z.string().url().optional().nullable().or(z.literal("")),
    healthStatus: z.enum(["healthy", "warning", "critical"]).optional(),
    environment: z.enum(["indoor", "outdoor", "greenhouse", "balcony"]).optional(),
    notes: z.string().max(2000).optional().nullable(),
    regenerateSchedule: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const reminderSchema = z.object({
  plantId: z.string().optional().nullable(),
  titleEn: z.string().min(1).max(160),
  titleFa: z.string().min(1).max(160),
  type: z.enum([
    "watering",
    "fertilizing",
    "pruning",
    "repotting",
    "inspection",
    "custom",
  ]),
  scheduledAt: z.string().datetime(),
  recurring: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type PlantInput = z.infer<typeof plantSchema>;
export const reminderUpdateSchema = z
  .object({
    id: z.string().min(1),
    completed: z.boolean().optional(),
    titleEn: z.string().min(1).max(160).optional(),
    titleFa: z.string().min(1).max(160).optional(),
    type: z
      .enum([
        "watering",
        "fertilizing",
        "pruning",
        "repotting",
        "inspection",
        "custom",
      ])
      .optional(),
    scheduledAt: z.string().datetime().optional(),
    plantId: z.string().nullable().optional(),
    recurring: z
      .enum(["daily", "weekly", "biweekly", "monthly"])
      .nullable()
      .optional(),
    notes: z.string().max(1000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 1, {
    message: "At least one field besides id is required",
  });

export type ReminderUpdateInput = z.infer<typeof reminderUpdateSchema>;
