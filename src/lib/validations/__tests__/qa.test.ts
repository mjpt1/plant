import { describe, it, expect } from "vitest";
import {
  questionSchema,
  voteSchema,
  answerSchema,
  verifyAnswerSchema,
} from "@/lib/validations/qa";

describe("questionSchema", () => {
  it("accepts valid question with UI categories", () => {
    const result = questionSchema.safeParse({
      title: "Yellow leaves on monstera",
      content: "My monstera has yellow spots on lower leaves.",
      category: "disease",
      tags: ["monstera", "yellow"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects legacy plural category names", () => {
    const result = questionSchema.safeParse({
      title: "Pest problem here",
      content: "Tiny bugs on my plant leaves everywhere.",
      category: "pests",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all defined categories", () => {
    const categories = [
      "soil",
      "pest",
      "watering",
      "disease",
      "sunlight",
      "fertilizer",
      "care",
      "general",
    ] as const;

    for (const category of categories) {
      const result = questionSchema.safeParse({
        title: "Valid title here",
        content: "Valid content with enough length.",
        category,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("voteSchema", () => {
  it("accepts upvote and downvote", () => {
    expect(voteSchema.safeParse({ answerId: "abc", value: 1 }).success).toBe(true);
    expect(voteSchema.safeParse({ answerId: "abc", value: -1 }).success).toBe(true);
  });

  it("rejects invalid vote values", () => {
    expect(voteSchema.safeParse({ answerId: "abc", value: 0 }).success).toBe(false);
    expect(voteSchema.safeParse({ answerId: "abc", value: 2 }).success).toBe(false);
  });
});

describe("answerSchema", () => {
  it("requires minimum content length", () => {
    const result = answerSchema.safeParse({
      questionId: "q1",
      content: "hi",
    });
    expect(result.success).toBe(false);
  });
});

describe("verifyAnswerSchema", () => {
  it("accepts verify toggle payload", () => {
    const result = verifyAnswerSchema.safeParse({
      answerId: "a1",
      verified: true,
    });
    expect(result.success).toBe(true);
  });
});
