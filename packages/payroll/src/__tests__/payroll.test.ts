import type { Money } from "@naql/core";
import { describe, expect, it } from "vitest";
import { DEFAULT_PAYROLL_CONFIG } from "../config";
import { computePayslip } from "../payslip";

const EMP = "emp-001";

describe("computePayslip", () => {
  it("baseline: 4500 MAD gross, no absences, no advances", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 450_000 as Money, // 4,500 MAD
      absenceDays: 0,
      workingDays: 22,
      advancesCentimes: 0 as Money,
    });

    expect(p.grossBeforeDeductions).toBe(450_000);
    expect(p.absenceDeduction).toBe(0);
    expect(p.grossAfterDeductions).toBe(450_000);

    // CNSS: 450,000 × 4.48% = 20,160
    expect(p.cnssEmployee).toBe(20_160);

    // AMO: 450,000 × 2.26% = 10,170
    expect(p.amoEmployee).toBe(10_170);

    // Taxable = 450,000 - 20,160 - 10,170 = 419,670
    // Annual = 419,670 × 12 = 5,036,040 → bracket 5,000,001–6,000,000 → 20%
    // annualIR = 200,000 + (5,036,040 - 5,000,000) × 0.2 = 207,208 → monthly = 17,267
    expect(p.irWithheld).toBe(17_267);

    // Net = 450,000 - 20,160 - 10,170 - 17,267 = 402,403
    expect(p.net).toBe(402_403);

    // All values are integers
    expect(Number.isInteger(p.net)).toBe(true);
    expect(Number.isInteger(p.cnssEmployee)).toBe(true);
  });

  it("absence deduction is pro-rata", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 440_000 as Money, // 4,400 MAD
      absenceDays: 2,
      workingDays: 22,
      advancesCentimes: 0 as Money,
    });

    // Deduction = 440,000 / 22 * 2 = 40,000
    expect(p.absenceDeduction).toBe(40_000);
    expect(p.grossAfterDeductions).toBe(400_000);
  });

  it("advance is deducted from net — net cannot go below zero", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 320_000 as Money, // 3,200 MAD
      absenceDays: 0,
      workingDays: 22,
      advancesCentimes: 400_000 as Money, // advance > net → net = 0
    });

    expect(p.advancesDeducted).toBe(400_000);
    expect(p.net).toBe(0); // floored at 0, never negative
  });

  it("CNSS base is capped at ceiling (6,000 MAD)", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 1_500_000 as Money, // 15,000 MAD > ceiling
      absenceDays: 0,
      workingDays: 22,
      advancesCentimes: 0 as Money,
    });

    // CNSS base = min(1,500,000, 600,000) = 600,000
    // CNSS = 600,000 × 4.48% = 26,880
    expect(p.cnssEmployee).toBe(26_880);
  });

  it("employer cost = gross + CNSS employer + AMO employer", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 450_000 as Money,
      absenceDays: 0,
      workingDays: 22,
      advancesCentimes: 0 as Money,
    });

    const cnssBase = Math.min(450_000, 600_000);
    const cnssEmployer = Math.round(cnssBase * DEFAULT_PAYROLL_CONFIG.cnssEmployerRate);
    const amoEmployer = Math.round(450_000 * DEFAULT_PAYROLL_CONFIG.amoEmployerRate);

    expect(p.cnssEmployer).toBe(cnssEmployer);
    expect(p.amoEmployer).toBe(amoEmployer);
    expect(p.totalEmployerCost).toBe(450_000 + cnssEmployer + amoEmployer);
  });

  it("zero gross edge case", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 0 as Money,
      absenceDays: 0,
      workingDays: 22,
      advancesCentimes: 0 as Money,
    });

    expect(p.net).toBe(0);
    expect(p.cnssEmployee).toBe(0);
    expect(p.irWithheld).toBe(0);
  });

  it("all 22 days absent → gross after deductions = 0, net = 0", () => {
    const p = computePayslip({
      employeeId: EMP,
      grossCentimes: 450_000 as Money,
      absenceDays: 22,
      workingDays: 22,
      advancesCentimes: 0 as Money,
    });

    expect(p.grossAfterDeductions).toBe(0);
    expect(p.net).toBe(0);
  });
});
