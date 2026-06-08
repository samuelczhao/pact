import { describe, it, expect } from "vitest";
import { computePactScore, scoreChange } from "../pact-score";

function makeCommitment(
  status: "completed" | "failed" | "active",
  amount: number,
  daysAgo: number,
) {
  const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return { status, amount, created_at: date, deadline: null } as const;
}

describe("computePactScore", () => {
  it("returns base score of 500 for no commitments", () => {
    expect(computePactScore([])).toBe(500);
  });

  it("adds points for completed pacts", () => {
    const score = computePactScore([makeCommitment("completed", 50, 1)]);
    expect(score).toBeGreaterThan(500);
  });

  it("subtracts points for failed pacts", () => {
    const score = computePactScore([makeCommitment("failed", 50, 1)]);
    expect(score).toBeLessThan(500);
  });

  it("scales with stake amount up to 3x cap", () => {
    const small = computePactScore([makeCommitment("completed", 10, 1)]);
    const medium = computePactScore([makeCommitment("completed", 50, 1)]);
    const large = computePactScore([makeCommitment("completed", 200, 1)]);

    expect(medium).toBeGreaterThan(small);
    expect(large).toBeGreaterThan(medium);

    const huge = computePactScore([makeCommitment("completed", 500, 1)]);
    expect(huge).toBe(large);
  });

  it("ignores active commitments for score", () => {
    const score = computePactScore([makeCommitment("active", 100, 1)]);
    expect(score).toBe(500);
  });

  it("adds streak bonus for consecutive completions", () => {
    const commitments = [
      makeCommitment("completed", 50, 1),
      makeCommitment("completed", 50, 5),
      makeCommitment("completed", 50, 10),
    ];
    const score = computePactScore(commitments);
    const singleScore = computePactScore([makeCommitment("completed", 50, 1)]);
    expect(score).toBeGreaterThan(singleScore + 100);
  });

  it("caps streak bonus at 200", () => {
    const manyCompleted = Array.from({ length: 30 }, (_, i) =>
      makeCommitment("completed", 50, i * 3),
    );
    const score = computePactScore(manyCompleted);
    const baseWithCompletions = 500 + 30 * 50 + 200;
    expect(score).toBeLessThanOrEqual(1000);
    expect(score).toBe(1000);
  });

  it("never exceeds 1000", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      makeCommitment("completed", 150, i * 2),
    );
    expect(computePactScore(many)).toBe(1000);
  });

  it("never goes below 0", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      makeCommitment("failed", 150, i * 2),
    );
    expect(computePactScore(many)).toBe(0);
  });

  it("applies decay for inactivity but respects floor", () => {
    const old = Array.from({ length: 10 }, (_, i) =>
      makeCommitment("completed", 50, 100 + i * 5),
    );
    const score = computePactScore(old);
    expect(score).toBeGreaterThanOrEqual(300);
  });
});

describe("scoreChange", () => {
  it("returns positive for completed", () => {
    expect(scoreChange("completed", 50)).toBe(50);
  });

  it("returns negative for failed", () => {
    expect(scoreChange("failed", 50)).toBe(-75);
  });

  it("scales with amount", () => {
    expect(scoreChange("completed", 100)).toBe(100);
    expect(scoreChange("failed", 100)).toBe(-150);
  });

  it("caps multiplier at 3x", () => {
    expect(scoreChange("completed", 500)).toBe(150);
    expect(scoreChange("failed", 500)).toBe(-225);
  });
});
