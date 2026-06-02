import type { Money } from "@naql/core";

export interface ParsedReceipt {
  litres?: number;
  pricePerLitre?: Money; // centimes
  total?: Money; // centimes
  date?: Date;
  station?: string;
  confidence: number; // 0–1 — composite of OCR confidence × field extraction quality
}

/** Minimum confidence to auto-accept (below = requires human review) */
export const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Parse OCR text from a Moroccan fuel receipt.
 * Returns a ReceiptDraft with field-level confidence scoring.
 */
export function parseReceipt(ocrText: string, ocrConfidence: number): ParsedReceipt {
  if (!ocrText.trim()) return { confidence: 0 };

  const _lines = ocrText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let _fieldsFound = 0;
  let fieldScore = 0;

  // ── Litres ───────────────────────────────────────────────────────────────────
  let litres: number | undefined;
  const litrePatterns = [
    /(\d+[.,]\d{1,3})\s*(?:l|L|litres?|LTR)/i,
    /(?:qte|qty|quantite|quantité)\s*:?\s*(\d+[.,]\d{1,3})/i,
    /(\d{2,3}[.,]\d{2,3})\s*(?:L|l)/,
  ];
  for (const p of litrePatterns) {
    const m = ocrText.match(p);
    if (m?.[1]) {
      litres = Number.parseFloat(m[1].replace(",", "."));
      if (litres > 0 && litres < 1000) {
        _fieldsFound++;
        fieldScore += 1;
        break;
      }
      litres = undefined;
    }
  }

  // ── Price per litre ───────────────────────────────────────────────────────────
  let pricePerLitre: Money | undefined;
  const pplPatterns = [
    /(?:prix|price|pu|p\.u\.?)\s*:?\s*(\d+[.,]\d{2,3})/i,
    /(\d+[.,]\d{2,3})\s*(?:dh|mad|dirh)/i,
    /(\d{1,2}[.,]\d{2,3})\s*\/\s*(?:l|litre)/i,
  ];
  for (const p of pplPatterns) {
    const m = ocrText.match(p);
    if (m?.[1]) {
      const dh = Number.parseFloat(m[1].replace(",", "."));
      if (dh > 5 && dh < 30) {
        // sanity: MAD fuel price range
        pricePerLitre = Math.round(dh * 100) as Money;
        _fieldsFound++;
        fieldScore += 1;
        break;
      }
    }
  }

  // ── Total ─────────────────────────────────────────────────────────────────────
  let total: Money | undefined;
  const totalPatterns = [
    /(?:total|montant|net\s*à\s*payer|ttc)\s*:?\s*(\d+[.,]\d{2})/i,
    /(\d{3,6}[.,]\d{2})\s*(?:dh|mad|dirh|$)/i,
  ];
  for (const p of totalPatterns) {
    const m = ocrText.match(p);
    if (m?.[1]) {
      const dh = Number.parseFloat(m[1].replace(",", "."));
      if (dh > 10 && dh < 10000) {
        total = Math.round(dh * 100) as Money;
        _fieldsFound++;
        fieldScore += 0.8;
        break;
      }
    }
  }

  // ── Date ─────────────────────────────────────────────────────────────────────
  let date: Date | undefined;
  const datePattern = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
  const dm = ocrText.match(datePattern);
  if (dm) {
    const [, d, mo, y] = dm;
    const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);
    const parsed = new Date(year, Number(mo) - 1, Number(d));
    if (!Number.isNaN(parsed.getTime()) && parsed <= new Date()) {
      date = parsed;
      _fieldsFound++;
      fieldScore += 0.5;
    }
  }

  // ── Station name ─────────────────────────────────────────────────────────────
  let station: string | undefined;
  const stationPatterns = [/(?:afriquia|total|shell|ziz|petrom|winxo|lsigas|naftal)/i];
  for (const p of stationPatterns) {
    const m = ocrText.match(p);
    if (m) {
      station = m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase();
      fieldScore += 0.3;
      break;
    }
  }

  // Composite confidence: OCR confidence × field extraction quality
  const maxScore = 3.8; // max possible fieldScore
  const extractionQuality = Math.min(fieldScore / maxScore, 1);
  const confidence = ocrConfidence * extractionQuality;

  return { litres, pricePerLitre, total, date, station, confidence };
}
