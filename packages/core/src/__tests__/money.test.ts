import { describe, it, expect } from "vitest";
import {
  money, add, subtract, multiply, computeVat, zero, sum,
  formatMAD, parseMAD, fromDirhams, toDirhams,
} from "../money";
import type { Money } from "../types";

describe("money() constructor", () => {
  it("creates a branded Money from integer", () => {
    const m = money(100);
    expect(m).toBe(100);
  });

  it("throws for non-integer centimes", () => {
    expect(() => money(1.5)).toThrow("integer centimes");
  });

  it("zero() returns 0", () => {
    expect(zero()).toBe(0);
  });
});

describe("arithmetic", () => {
  it("add works correctly", () => {
    expect(add(money(100), money(200))).toBe(300);
  });

  it("subtract works correctly", () => {
    expect(subtract(money(500), money(200))).toBe(300);
  });

  it("multiply rounds to nearest centime", () => {
    // 333 × 3 = 999
    expect(multiply(money(333), 3)).toBe(999);
    // 100 × 1.5 = 150 (exact)
    expect(multiply(money(100), 1.5)).toBe(150);
    // 100 × 0.333 = 33.3 → rounds to 33
    expect(multiply(money(100), 0.333)).toBe(33);
  });

  it("computeVat rounds correctly", () => {
    // 800_000 × 20% = 160_000
    expect(computeVat(money(800_000), 0.2)).toBe(160_000);
    // Non-round: 333 × 20% = 66.6 → 67
    expect(computeVat(money(333), 0.2)).toBe(67);
  });

  it("sum reduces correctly", () => {
    const amounts = [100, 200, 300].map((n) => money(n));
    expect(sum(amounts)).toBe(600);
  });

  it("sum of empty array = 0", () => {
    expect(sum([])).toBe(0);
  });
});

describe("formatMAD", () => {
  it("formats centimes to MAD string (fr)", () => {
    const s = formatMAD(money(800_000));
    expect(s).toContain("MAD");
    expect(s).toContain("8");
  });

  it("formats AR locale", () => {
    const s = formatMAD(money(100_000), "ar");
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("formats 0 centimes", () => {
    const s = formatMAD(money(0));
    expect(s).toContain("0");
  });
});

describe("parseMAD", () => {
  it("parses a dirham string to centimes", () => {
    expect(parseMAD("8000")).toBe(800_000);
  });

  it("parses decimal MAD", () => {
    expect(parseMAD("12.85")).toBe(1285);
  });

  it("parses comma-decimal", () => {
    expect(parseMAD("12,85")).toBe(1285);
  });

  it("strips currency symbols", () => {
    expect(parseMAD("8 000 MAD")).toBe(800_000);
  });

  it("throws on invalid input", () => {
    expect(() => parseMAD("abc")).toThrow();
  });
});

describe("fromDirhams / toDirhams", () => {
  it("fromDirhams converts MAD to centimes", () => {
    expect(fromDirhams(12.85)).toBe(1285);
    expect(fromDirhams(8000)).toBe(800_000);
  });

  it("toDirhams converts centimes to MAD float", () => {
    expect(toDirhams(money(1285))).toBeCloseTo(12.85, 2);
    expect(toDirhams(money(800_000))).toBe(8000);
  });

  it("round-trip: fromDirhams → toDirhams", () => {
    const centimes = fromDirhams(150.5);
    expect(toDirhams(centimes)).toBeCloseTo(150.5, 2);
  });
});
