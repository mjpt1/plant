import { describe, it, expect, afterEach } from "vitest";
import {
  getOAuthEnvStatus,
  OAUTH_PROVIDER_IDS,
} from "@/lib/oauth/build-providers";

const ORIGINAL_ENV = { ...process.env };

describe("getOAuthEnvStatus", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("lists all supported providers", () => {
    expect(OAUTH_PROVIDER_IDS).toEqual(["google", "github", "instagram"]);
  });

  it("returns false when env vars are missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    delete process.env.INSTAGRAM_CLIENT_ID;
    delete process.env.INSTAGRAM_CLIENT_SECRET;

    expect(getOAuthEnvStatus()).toEqual({
      google: false,
      github: false,
      instagram: false,
    });
  });

  it("returns true only when both id and secret exist", () => {
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.GITHUB_CLIENT_ID = "id";
    delete process.env.GITHUB_CLIENT_SECRET;

    const status = getOAuthEnvStatus();
    expect(status.google).toBe(true);
    expect(status.github).toBe(false);
  });
});
