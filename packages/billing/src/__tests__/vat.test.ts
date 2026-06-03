import { describe, it, expect } from "vitest";
import { computeVat, computeTotal, DEFAULT_VAT_RATE } from "../vat";
import type { Money } from "@naql/core";

describe("VAT computation", () => {
  it("DEFAULT_VAT_RATE is 20", () => {
    expect(DEFAULT_VAT_RATE).toBe(20);
  });

  it("computeVat at 20% on 800,000 centimes", () => {
    expect(computeVat(800_000 as Money, 20)).toBe(160_000);
  });

  it("computeVat at 0% returns 0", () => {
    expect(computeVat(500_000 as Money, 0)).toBe(0);
  });

  it("computeVat rounds to integer centimes", () => {
    const v = computeVat(333 as Money, 20);
    expect(Number.isInteger(v)).toBe(true);
  });

  it("computeTotal = subtotal + vatAmount", () => {
    const subtotal = 800_000 as Money;
    const vat = computeVat(subtotal, 20);
    expect(computeTotal(subtotal, vat)).toBe(960_000);
  });
});
