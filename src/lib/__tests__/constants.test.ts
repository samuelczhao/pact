import { describe, it, expect } from "vitest";
import { STATUS_CONFIG, DEADLINE_PRESETS } from "@/lib/constants";

describe("STATUS_CONFIG", () => {
  const EXPECTED_STATUSES = [
    "active",
    "pending_proof",
    "awaiting_verification",
    "completed",
    "failed",
  ];

  it("has all 5 statuses defined", () => {
    for (const status of EXPECTED_STATUSES) {
      expect(STATUS_CONFIG[status]).toBeDefined();
    }
  });

  it("each status has label and className", () => {
    for (const status of EXPECTED_STATUSES) {
      expect(STATUS_CONFIG[status].label).toBeTruthy();
      expect(STATUS_CONFIG[status].className).toBeTruthy();
    }
  });
});

describe("DEADLINE_PRESETS", () => {
  it("all presets return future dates", () => {
    const now = new Date();
    for (const preset of DEADLINE_PRESETS) {
      const value = preset.getValue();
      expect(value.getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });

  it("each preset has a label and getValue function", () => {
    for (const preset of DEADLINE_PRESETS) {
      expect(typeof preset.label).toBe("string");
      expect(preset.label.length).toBeGreaterThan(0);
      expect(typeof preset.getValue).toBe("function");
    }
  });

  it("has 4 presets", () => {
    expect(DEADLINE_PRESETS).toHaveLength(4);
  });
});
