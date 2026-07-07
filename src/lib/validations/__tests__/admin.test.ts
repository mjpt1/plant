import { describe, it, expect } from "vitest";
import {
  adminRoleSchema,
  adminPostVisibilitySchema,
  adminReportReviewSchema,
} from "@/lib/validations/admin";
import { Role } from "@prisma/client";

describe("adminRoleSchema", () => {
  it("accepts valid role assignment", () => {
    const result = adminRoleSchema.safeParse({
      userId: "user1",
      role: Role.EXPERT,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = adminRoleSchema.safeParse({
      userId: "user1",
      role: "SUPERADMIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("adminPostVisibilitySchema", () => {
  it("accepts hide/show toggle", () => {
    const result = adminPostVisibilitySchema.safeParse({
      postId: "post1",
      isHidden: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("adminReportReviewSchema", () => {
  it("accepts report review with hide", () => {
    const result = adminReportReviewSchema.safeParse({
      reportId: "r1",
      status: "REVIEWED",
      hideTarget: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = adminReportReviewSchema.safeParse({
      reportId: "r1",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});
