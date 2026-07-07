import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "demo@plantcare.ir",
      password: "demo1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "demo1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "demo@plantcare.ir",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      username: "test_gardener",
      email: "test@example.com",
      password: "password123",
      country: "Iran",
      city: "Tehran",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid username characters", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      username: "bad user!",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "A",
      username: "valid_user",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});
