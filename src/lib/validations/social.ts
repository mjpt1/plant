import { z } from "zod";

export const postSchema = z.object({
  content: z.string().min(1).max(2000),
  imageUrl: z
    .string()
    .refine((v) => !v || v.startsWith("http") || v.startsWith("data:image/"), {
      message: "Invalid image URL",
    })
    .optional()
    .nullable(),
});

export const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(1000),
});

export const reportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "QUESTION", "ANSWER", "USER"]),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(1000).optional().nullable(),
});

export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
