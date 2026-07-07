import { describe, it, expect } from "vitest";
import {
  postSchema,
  commentSchema,
  reportSchema,
} from "@/lib/validations/social";

describe("postSchema", () => {
  it("accepts text-only post", () => {
    const result = postSchema.safeParse({ content: "My monstera is thriving!" });
    expect(result.success).toBe(true);
  });

  it("accepts post with http image URL", () => {
    const result = postSchema.safeParse({
      content: "Check out my plant",
      imageUrl: "https://example.com/plant.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = postSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid image URL", () => {
    const result = postSchema.safeParse({
      content: "Hello",
      imageUrl: "ftp://bad.url",
    });
    expect(result.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("accepts valid comment", () => {
    const result = commentSchema.safeParse({
      postId: "post1",
      content: "Beautiful plant!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty comment", () => {
    const result = commentSchema.safeParse({
      postId: "post1",
      content: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts post report", () => {
    const result = reportSchema.safeParse({
      targetType: "POST",
      targetId: "p1",
      reason: "Inappropriate content",
    });
    expect(result.success).toBe(true);
  });

  it("accepts comment report with details", () => {
    const result = reportSchema.safeParse({
      targetType: "COMMENT",
      targetId: "c1",
      reason: "Spam",
      details: "Repeated promotional links",
    });
    expect(result.success).toBe(true);
  });

  it("accepts user report", () => {
    const result = reportSchema.safeParse({
      targetType: "USER",
      targetId: "u1",
      reason: "Harassment",
    });
    expect(result.success).toBe(true);
  });
});
