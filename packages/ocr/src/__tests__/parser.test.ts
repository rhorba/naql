import { describe, expect, it } from "vitest";
import { CONFIDENCE_THRESHOLD, parseReceipt } from "../parser";

describe("parseReceipt", () => {
  it("empty OCR text returns zero confidence", () => {
    const r = parseReceipt("", 0.9);
    expect(r.confidence).toBe(0);
    expect(r.litres).toBeUndefined();
  });

  it("parses litres from typical Moroccan fuel receipt", () => {
    const text = `
      AFRIQUIA
      Date: 02/06/2026
      Quantite: 65.30 L
      PU: 12.85 DH
      TOTAL: 839.21 DH
    `;
    const r = parseReceipt(text, 0.95);
    expect(r.litres).toBeCloseTo(65.3, 1);
    expect(r.pricePerLitre).toBe(1285); // 12.85 MAD in centimes
    expect(r.total).toBe(83921); // 839.21 MAD in centimes
    expect(r.station).toBe("Afriquia");
    expect(r.date).toBeDefined();
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it("parses litres with comma decimal separator", () => {
    const text = "Qte: 48,50 L  Prix: 12,90 DH  Total: 625,65 DH";
    const r = parseReceipt(text, 0.88);
    expect(r.litres).toBeCloseTo(48.5, 1);
    expect(r.pricePerLitre).toBe(1290);
  });

  it("requires human review when confidence < threshold", () => {
    // Low OCR confidence → composite confidence below threshold
    const r = parseReceipt("Qte 30L Prix 12.80", 0.3);
    expect(r.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
  });

  it("high confidence receipt clears threshold", () => {
    const text = `
      TOTAL MAROC
      Date: 01/06/2026
      Quantite: 80.00 L
      Prix unitaire: 12.90 DH
      TOTAL: 1032.00 DH
    `;
    const r = parseReceipt(text, 0.98);
    expect(r.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    expect(r.litres).toBe(80);
  });

  it("garbage OCR text does not throw and returns low confidence", () => {
    const r = parseReceipt("@#$%^&* ??? !!!  123ABC", 0.9);
    expect(r.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    expect(() => r).not.toThrow();
  });

  it("implausible litres (> 1000) are ignored", () => {
    // A truck might hold 400L at most — 9999L is garbage
    const r = parseReceipt("Quantite: 9999 L  Prix: 12.85", 0.9);
    expect(r.litres).toBeUndefined();
  });

  it("implausible price (< 5 MAD or > 30 MAD) is ignored", () => {
    const r = parseReceipt("Qte: 60 L  PU: 0.50 DH  Total: 30 DH", 0.9);
    expect(r.pricePerLitre).toBeUndefined();
  });

  it("CONFIDENCE_THRESHOLD is a number between 0 and 1", () => {
    expect(CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
    expect(CONFIDENCE_THRESHOLD).toBeLessThanOrEqual(1);
  });
});
