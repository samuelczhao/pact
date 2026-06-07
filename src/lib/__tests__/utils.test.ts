import { describe, it, expect } from "vitest";
import {
  generateVenmoLink,
  formatCurrency,
  isEditable,
  minutesRemaining,
} from "@/lib/utils";

describe("generateVenmoLink", () => {
  it("produces correct venmo:// URL format", () => {
    const link = generateVenmoLink("john-doe", 25, "Run 5 miles");
    expect(link).toContain("venmo://paycharge");
    expect(link).toContain("recipients=john-doe");
    expect(link).toContain("amount=25");
    expect(link).toContain("txn=pay");
  });

  it("encodes special characters in pact title", () => {
    const link = generateVenmoLink("jane", 10, "Do push-ups & sit-ups");
    expect(link).toContain(encodeURIComponent('Lost pact: "Do push-ups & sit-ups"'));
  });

  it("handles title with quotes", () => {
    const link = generateVenmoLink("user", 5, 'Say "hello"');
    expect(link).toContain(encodeURIComponent('Lost pact: "Say "hello""'));
  });
});

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative numbers", () => {
    expect(formatCurrency(-15)).toBe("-$15.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats whole numbers with two decimals", () => {
    expect(formatCurrency(50)).toBe("$50.00");
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(9.999)).toBe("$10.00");
  });
});

describe("isEditable", () => {
  it("returns true for future dates", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isEditable(future)).toBe(true);
  });

  it("returns false for past dates", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isEditable(past)).toBe(false);
  });
});

describe("minutesRemaining", () => {
  it("returns positive for future deadlines", () => {
    const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    expect(minutesRemaining(future)).toBeGreaterThan(0);
  });

  it("returns negative for past deadlines", () => {
    const past = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(minutesRemaining(past)).toBeLessThan(0);
  });
});
