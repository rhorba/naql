import type { Money } from "@naql/core";

const CNSS_RATE = 0.0448;
const CNSS_CEILING = 600_000 as Money;

export interface PayrollResult {
  gross: Money;
  cnssEmployee: Money;
  irWithheld: Money;
  net: Money;
}

export function computePayroll(grossCentimes: Money): PayrollResult {
  const cnssBase = Math.min(grossCentimes, CNSS_CEILING) as Money;
  const cnssEmployee = Math.round(cnssBase * CNSS_RATE) as Money;
  const taxableBase = (grossCentimes - cnssEmployee) as Money;
  const irWithheld = computeIR(taxableBase);
  const net = (grossCentimes - cnssEmployee - irWithheld) as Money;
  return { gross: grossCentimes, cnssEmployee, irWithheld, net };
}

function computeIR(taxableMonthly: Money): Money {
  const annual = taxableMonthly * 12;
  let annualIR: number;
  if (annual <= 3_000_000) annualIR = 0;
  else if (annual <= 5_000_000) annualIR = (annual - 3_000_000) * 0.1;
  else if (annual <= 6_000_000) annualIR = 200_000 + (annual - 5_000_000) * 0.2;
  else if (annual <= 8_000_000) annualIR = 400_000 + (annual - 6_000_000) * 0.3;
  else if (annual <= 18_000_000) annualIR = 1_000_000 + (annual - 8_000_000) * 0.34;
  else annualIR = 4_400_000 + (annual - 18_000_000) * 0.38;
  return Math.round(annualIR / 12) as Money;
}
