import { z } from "zod";
import { Role } from "@prisma/client";

export const adminRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
});

export const adminPostVisibilitySchema = z.object({
  postId: z.string().min(1),
  isHidden: z.boolean(),
});

export const adminReportReviewSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED"]),
  hideTarget: z.boolean().optional(),
});

export const adminCatalogActionSchema = z.object({
  catalogId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export const adminCommentVisibilitySchema = z.object({
  commentId: z.string().min(1),
  isHidden: z.boolean(),
});

export const expertInsightSchema = z.object({
  catalogId: z.string().min(1),
  expertInsight: z.string().min(10).max(2000),
});
