import { describe, it, expect } from "vitest";
import { computePayroll } from "../calculator";
import type { Money } from "@naql/core";

describe("computePayroll (legacy calculator)", () => {
  it("returns integer centimes", () => {
    const r = computePayroll(450_000 as Money);
    expect(Number.isInteger(r.net)).toBe(true);
    expect(Number.isInteger(r.cnssEmployee)).toBe(true);
    expect(Number.isInteger(r.irWithheld)).toBe(true);
  });

  it("CNSS capped at 6000 MAD ceiling", () => {
    const r = computePayroll(1_500_000 as Money);
    // CNSS = 600_000 × 4.48% = 26,880
    expect(r.cnssEmployee).toBe(26_880);
  });

  it("net < gross", () => {
    const r = computePayroll(400_000 as Money);
    expect(r.net).toBeLessThan(400_000);
  });

  it("zero IR for income below 30,000 MAD/year (2,500/month)", () => {
    // 250,000 centimes = 2,500 MAD/month → annual = 30,000 → 0 IR
    const r = computePayroll(250_000 as Money);
    expect(r.irWithheld).toBe(0);
  });

  it("gross = net + cnss + ir", () => {
    const r = computePayroll(600_000 as Money);
    expect(r.gross).toBe(r.net + r.cnssEmployee + r.irWithheld);
  });

  it("high earner hits top bracket", () => {
    const r = computePayroll(3_000_000 as Money); // 30,000 MAD
    expect(r.irWithheld).toBeGreaterThan(0);
  });
});
