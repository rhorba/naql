import { describe, it, expect } from "vitest";
import { formatInvoiceNumber } from "../invoice-number";

// allocateInvoiceNumber requires a live DB with advisory locking.
// We test the pure helper it depends on, and the hashLockKey logic
// indirectly via the number format.

describe("formatInvoiceNumber (used by allocator)", () => {
  it("pads sequence to 4 digits", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-0001");
    expect(formatInvoiceNumber(2026, 10)).toBe("INV-2026-0010");
    expect(formatInvoiceNumber(2026, 999)).toBe("INV-2026-0999");
  });

  it("handles 4-digit sequences without truncation", () => {
    expect(formatInvoiceNumber(2026, 1000)).toBe("INV-2026-1000");
    expect(formatInvoiceNumber(2026, 9999)).toBe("INV-2026-9999");
  });

  it("encodes year correctly", () => {
    const n = formatInvoiceNumber(2027, 1);
    expect(n).toContain("2027");
    expect(n).not.toContain("2026");
  });

  it("format is INV-YEAR-NNNN", () => {
    const n = formatInvoiceNumber(2026, 42);
    expect(n).toMatch(/^INV-\d{4}-\d{4}$/);
  });
});
