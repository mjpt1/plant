import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes and resolves conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", false && "hidden", "font-bold")).toBe(
      "text-red-500 font-bold"
    );
  });
});
