import type { Money } from "./types";

// Constructor — the only way to create a Money value
export function money(centimes: number): Money {
  if (!Number.isInteger(centimes)) {
    throw new Error(`Money must be integer centimes, got: ${centimes}`);
  }
  return centimes as Money;
}

export function add(a: Money, b: Money): Money {
  return money(a + b);
}

export function subtract(a: Money, b: Money): Money {
  return money(a - b);
}

// Multiply by a plain number (e.g. quantity), rounds to nearest centime
export function multiply(m: Money, factor: number): Money {
  return money(Math.round(m * factor));
}

// Compute VAT amount from a subtotal
export function computeVat(subtotal: Money, vatRate: number): Money {
  return money(Math.round(subtotal * vatRate));
}

export function zero(): Money {
  return money(0);
}

export function sum(amounts: Money[]): Money {
  return amounts.reduce((acc, m) => add(acc, m), zero());
}

// Format centimes as a MAD string for display only — never store the result
export function formatMAD(centimes: Money, locale: "fr" | "ar" | "en" = "fr"): string {
  const dirhams = centimes / 100;
  return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dirhams);
}

// Parse a user-entered dirham string to centimes (for input fields)
export function parseMAD(input: string): Money {
  const cleaned = input.replace(/[^\d.,]/g, "").replace(",", ".");
  const dirhams = Number.parseFloat(cleaned);
  if (Number.isNaN(dirhams)) throw new Error(`Cannot parse money: "${input}"`);
  return money(Math.round(dirhams * 100));
}

// Convert dirham display value (float) to centimes — use only at system boundaries
export function fromDirhams(dirhams: number): Money {
  return money(Math.round(dirhams * 100));
}

export function toDirhams(centimes: Money): number {
  return centimes / 100;
}
