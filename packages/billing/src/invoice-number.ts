import type { Money } from "@naql/core";

/** Sequential invoice number per org per year: INV-2026-0001 */
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}

/** Round half-up for MAD centimes */
export function roundCentimes(n: number): Money {
  return Math.round(n) as Money;
}
