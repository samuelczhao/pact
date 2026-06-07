import { describe, it, expect } from "vitest";

/**
 * Validation logic extracted from the commitments POST route.
 * These mirror the checks in src/app/api/commitments/route.ts.
 */

function validateTitle(title: unknown): string | null {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return "Title is required";
  }
  return null;
}

function validateAmount(amount: unknown): string | null {
  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    return "Amount must be greater than 0";
  }
  if (amount > 10000) {
    return "Amount exceeds maximum";
  }
  return null;
}

function validateDeadline(deadline: unknown): string | null {
  if (!deadline) {
    return "Deadline is required";
  }
  const date = new Date(deadline as string);
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  if (date <= new Date()) {
    return "Deadline must be in the future";
  }
  return null;
}

function validateApproved(approved: unknown): string | null {
  if (approved === undefined) {
    return null;
  }
  if (typeof approved !== "boolean") {
    return "Approved must be a boolean";
  }
  return null;
}

describe("title validation", () => {
  it("rejects empty string", () => {
    expect(validateTitle("")).not.toBeNull();
  });

  it("rejects whitespace-only string", () => {
    expect(validateTitle("   ")).not.toBeNull();
  });

  it("rejects null/undefined", () => {
    expect(validateTitle(null)).not.toBeNull();
    expect(validateTitle(undefined)).not.toBeNull();
  });

  it("accepts valid title", () => {
    expect(validateTitle("Run 5 miles")).toBeNull();
  });
});

describe("amount validation", () => {
  it("rejects negative amounts", () => {
    expect(validateAmount(-5)).not.toBeNull();
  });

  it("rejects zero", () => {
    expect(validateAmount(0)).not.toBeNull();
  });

  it("rejects NaN", () => {
    expect(validateAmount(NaN)).not.toBeNull();
  });

  it("rejects non-number types", () => {
    expect(validateAmount("25")).not.toBeNull();
  });

  it("accepts valid amount", () => {
    expect(validateAmount(25)).toBeNull();
  });

  it("rejects amounts over 10000", () => {
    expect(validateAmount(10001)).not.toBeNull();
  });

  it("accepts boundary value 10000", () => {
    expect(validateAmount(10000)).toBeNull();
  });
});

describe("deadline validation", () => {
  it("rejects past date", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(validateDeadline(past)).not.toBeNull();
  });

  it("rejects empty value", () => {
    expect(validateDeadline("")).not.toBeNull();
    expect(validateDeadline(null)).not.toBeNull();
  });

  it("accepts valid future date", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(validateDeadline(future)).toBeNull();
  });
});

describe("approved field validation", () => {
  it("accepts undefined (field not provided)", () => {
    expect(validateApproved(undefined)).toBeNull();
  });

  it("rejects string value", () => {
    expect(validateApproved("true")).not.toBeNull();
  });

  it("accepts boolean true", () => {
    expect(validateApproved(true)).toBeNull();
  });

  it("accepts boolean false", () => {
    expect(validateApproved(false)).toBeNull();
  });
});
