import { z } from "zod";
import { QA_CATEGORIES } from "@/lib/qa-categories";

export const questionSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  category: z.enum(QA_CATEGORIES),
  tags: z.array(z.string().min(1).max(40)).max(8).default([]),
});

export const answerSchema = z.object({
  questionId: z.string().min(1),
  content: z.string().min(5).max(5000),
});

export const voteSchema = z.object({
  answerId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const verifyAnswerSchema = z.object({
  answerId: z.string().min(1),
  verified: z.boolean(),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
