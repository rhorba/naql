import { add, computeVat, money, multiply, sum } from "@naql/core";
import type { Money } from "@naql/core";
import { DEFAULT_VAT_RATE } from "./vat";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: Money; // centimes
  amount: Money; // centimes — always quantity × unitPrice
}

export interface InvoiceTotals {
  lines: InvoiceLine[];
  subtotal: Money;
  vatRate: number; // integer percent, e.g. 20
  vatAmount: Money;
  total: Money;
}

export function buildInvoiceLine(
  description: string,
  quantity: number,
  unitPrice: Money
): InvoiceLine {
  return {
    description,
    quantity,
    unitPrice,
    amount: multiply(unitPrice, quantity),
  };
}

export function computeInvoiceTotals(
  lines: Omit<InvoiceLine, "amount">[],
  vatRate: number = DEFAULT_VAT_RATE
): InvoiceTotals {
  const builtLines = lines.map((l) => buildInvoiceLine(l.description, l.quantity, l.unitPrice));
  const subtotal = sum(builtLines.map((l) => l.amount));
  const vatAmount = computeVat(subtotal, vatRate / 100);
  const total = add(subtotal, vatAmount);

  return { lines: builtLines, subtotal, vatRate, vatAmount, total };
}

/** Build a credit note from an invoice (negates all amounts) */
export function buildCreditNoteTotals(original: InvoiceTotals): InvoiceTotals {
  return {
    lines: original.lines.map((l) => ({
      ...l,
      amount: money(-l.amount) as Money,
      unitPrice: money(-l.unitPrice) as Money,
    })),
    subtotal: money(-original.subtotal) as Money,
    vatRate: original.vatRate,
    vatAmount: money(-original.vatAmount) as Money,
    total: money(-original.total) as Money,
  };
}
