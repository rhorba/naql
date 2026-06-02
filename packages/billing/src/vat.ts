import type { Money } from "@naql/core";
import { roundCentimes } from "./invoice-number";

/** Standard Moroccan TVA rate (20%). Stored as integer: 20 = 20% */
export const DEFAULT_VAT_RATE = 20;

export function computeVat(subtotal: Money, rate: number): Money {
  return roundCentimes((subtotal * rate) / 100);
}

export function computeTotal(subtotal: Money, vatAmount: Money): Money {
  return (subtotal + vatAmount) as Money;
}
