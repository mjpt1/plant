import { describe, it, expect } from "vitest";
import { sortAnswers } from "@/lib/qa-votes";

describe("sortAnswers", () => {
  const base = {
    isExpertVerified: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("sorts accepted answers first", () => {
    const answers = sortAnswers([
      { id: "a", isAccepted: false, voteCount: 10, ...base },
      { id: "b", isAccepted: true, voteCount: 0, ...base },
    ]);
    expect(answers[0].id).toBe("b");
  });

  it("sorts by vote score when acceptance is equal", () => {
    const answers = sortAnswers([
      { id: "a", isAccepted: false, voteCount: 2, ...base },
      { id: "b", isAccepted: false, voteCount: 5, ...base },
    ]);
    expect(answers[0].id).toBe("b");
  });

  it("prefers expert verified when votes tie", () => {
    const answers = sortAnswers([
      { id: "a", isAccepted: false, voteCount: 3, isExpertVerified: false, createdAt: base.createdAt },
      { id: "b", isAccepted: false, voteCount: 3, isExpertVerified: true, createdAt: base.createdAt },
    ]);
    expect(answers[0].id).toBe("b");
  });

  it("sorts by oldest when all else ties", () => {
    const answers = sortAnswers([
      { id: "a", isAccepted: false, voteCount: 1, ...base, createdAt: "2026-01-02T00:00:00.000Z" },
      { id: "b", isAccepted: false, voteCount: 1, ...base, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(answers[0].id).toBe("b");
  });
});
