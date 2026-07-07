import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { redirectPathForRole } from "@/lib/auth-redirect";
import { Role } from "@prisma/client";

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies passwords with bcrypt", async () => {
    const hash = await hashPassword("demo1234");
    expect(hash).not.toBe("demo1234");
    expect(await verifyPassword("demo1234", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("redirectPathForRole", () => {
  it("routes admins to /admin", () => {
    expect(redirectPathForRole(Role.ADMIN)).toBe("/admin");
  });

  it("routes experts to /expert", () => {
    expect(redirectPathForRole(Role.EXPERT)).toBe("/expert");
  });

  it("routes users to /dashboard", () => {
    expect(redirectPathForRole(Role.USER)).toBe("/dashboard");
  });
});
