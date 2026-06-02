import type { Money } from "@naql/core";
import { describe, expect, it } from "vitest";
import { buildCreditNoteTotals, computeInvoiceTotals } from "../invoice-compute";
import { formatInvoiceNumber } from "../invoice-number";
import { computeProfitability } from "../profitability";
import { DEFAULT_VAT_RATE, computeVat } from "../vat";

describe("computeInvoiceTotals", () => {
  it("computes VAT and total correctly — integer centimes only", () => {
    const result = computeInvoiceTotals([
      { description: "Transport", quantity: 1, unitPrice: 800_000 as Money },
    ]);
    expect(result.subtotal).toBe(800_000);
    expect(result.vatRate).toBe(DEFAULT_VAT_RATE); // 20
    expect(result.vatAmount).toBe(160_000); // 20% of 800,000
    expect(result.total).toBe(960_000);
  });

  it("handles multiple lines with quantity", () => {
    const result = computeInvoiceTotals([
      { description: "Voyage A", quantity: 2, unitPrice: 500_000 as Money },
      { description: "Voyage B", quantity: 1, unitPrice: 300_000 as Money },
    ]);
    expect(result.subtotal).toBe(1_300_000); // 2*500k + 300k
    expect(result.vatAmount).toBe(260_000); // 20%
    expect(result.total).toBe(1_560_000);
  });

  it("uses custom VAT rate", () => {
    const result = computeInvoiceTotals(
      [{ description: "Export", quantity: 1, unitPrice: 1_000_000 as Money }],
      0 // 0% VAT for exports
    );
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(1_000_000);
  });

  it("never produces fractional centimes", () => {
    // 3 units × 333,333 centimes = 999,999 → no float leak
    const result = computeInvoiceTotals([
      { description: "Partial", quantity: 3, unitPrice: 333_333 as Money },
    ]);
    expect(Number.isInteger(result.subtotal)).toBe(true);
    expect(Number.isInteger(result.vatAmount)).toBe(true);
    expect(Number.isInteger(result.total)).toBe(true);
  });
});

describe("buildCreditNoteTotals", () => {
  it("negates all amounts", () => {
    const original = computeInvoiceTotals([
      { description: "Transport", quantity: 1, unitPrice: 500_000 as Money },
    ]);
    const credit = buildCreditNoteTotals(original);
    expect(credit.subtotal).toBe(-500_000);
    expect(credit.vatAmount).toBe(-100_000);
    expect(credit.total).toBe(-600_000);
    expect(credit.vatRate).toBe(original.vatRate); // VAT rate unchanged
  });
});

describe("formatInvoiceNumber", () => {
  it("formats sequential numbers with zero-padding", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-0001");
    expect(formatInvoiceNumber(2026, 99)).toBe("INV-2026-0099");
    expect(formatInvoiceNumber(2026, 1000)).toBe("INV-2026-1000");
  });
});

describe("computeVat", () => {
  it("rounds half-up to integer centimes", () => {
    // 800_001 * 20% = 160,000.2 → rounds to 160,000
    const v = computeVat(800_001 as Money, 0.2);
    expect(Number.isInteger(v)).toBe(true);
  });
});

describe("computeProfitability", () => {
  it("computes margin correctly", () => {
    const result = computeProfitability({
      revenue: 1_000_000 as Money,
      fuelCost: 200_000 as Money,
      salaryCost: 100_000 as Money,
      maintenanceCost: 50_000 as Money,
      otherExpenses: 0 as Money,
      totalDistanceKm: 1000,
    });
    expect(result.grossMargin).toBe(650_000); // 1M - 350k
    expect(result.marginPct).toBe(65); // 65%
    expect(result.costPerKm).toBe(350); // 350 centimes/km = 3.50 MAD/km
  });

  it("handles zero revenue gracefully", () => {
    const result = computeProfitability({
      revenue: 0 as Money,
      fuelCost: 100_000 as Money,
      salaryCost: 0 as Money,
      maintenanceCost: 0 as Money,
      otherExpenses: 0 as Money,
      totalDistanceKm: 0,
    });
    expect(result.marginPct).toBe(0);
    expect(result.costPerKm).toBe(0);
  });

  it("negative margin when costs exceed revenue", () => {
    const result = computeProfitability({
      revenue: 100_000 as Money,
      fuelCost: 200_000 as Money,
      salaryCost: 0 as Money,
      maintenanceCost: 0 as Money,
      otherExpenses: 0 as Money,
      totalDistanceKm: 500,
    });
    expect(result.grossMargin).toBe(-100_000);
    expect(result.marginPct).toBe(-100);
  });
});
