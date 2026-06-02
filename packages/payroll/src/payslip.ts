import type { Money } from "@naql/core";
import { DEFAULT_PAYROLL_CONFIG } from "./config";
import type { PayrollConfig } from "./config";

export interface PayslipInput {
  employeeId: string;
  grossCentimes: Money;
  /** Days absent this month (deducted pro-rata) */
  absenceDays: number;
  /** Working days in the month */
  workingDays: number;
  /** Advances already paid this month (deducted from net) */
  advancesCentimes: Money;
  config?: PayrollConfig;
}

export interface Payslip {
  employeeId: string;
  grossBeforeDeductions: Money;
  absenceDeduction: Money;
  grossAfterDeductions: Money;
  cnssEmployee: Money;
  amoEmployee: Money;
  irWithheld: Money;
  advancesDeducted: Money;
  net: Money;
  /** Employer-side charges (for cost accounting) */
  cnssEmployer: Money;
  amoEmployer: Money;
  totalEmployerCost: Money;
}

export function computePayslip(input: PayslipInput): Payslip {
  const cfg = input.config ?? DEFAULT_PAYROLL_CONFIG;

  // Pro-rata deduction for absences
  const absenceDeduction =
    input.absenceDays > 0 && input.workingDays > 0
      ? (Math.round((input.grossCentimes / input.workingDays) * input.absenceDays) as Money)
      : (0 as Money);

  const grossAfterDeductions = (input.grossCentimes - absenceDeduction) as Money;

  // CNSS (capped at ceiling)
  const cnssBase = Math.min(grossAfterDeductions, cfg.cnssCeilingCentimes) as Money;
  const cnssEmployee = Math.round(cnssBase * cfg.cnssEmployeeRate) as Money;
  const cnssEmployer = Math.round(cnssBase * cfg.cnssEmployerRate) as Money;

  // AMO
  const amoEmployee = Math.round(grossAfterDeductions * cfg.amoEmployeeRate) as Money;
  const amoEmployer = Math.round(grossAfterDeductions * cfg.amoEmployerRate) as Money;

  // IR (progressive brackets on taxable = gross - CNSS - AMO)
  const taxableBase = (grossAfterDeductions - cnssEmployee - amoEmployee) as Money;
  const irWithheld = computeIR(taxableBase);

  // Net
  const net = Math.max(
    0,
    grossAfterDeductions - cnssEmployee - amoEmployee - irWithheld - input.advancesCentimes
  ) as Money;

  const totalEmployerCost = (grossAfterDeductions + cnssEmployer + amoEmployer) as Money;

  return {
    employeeId: input.employeeId,
    grossBeforeDeductions: input.grossCentimes,
    absenceDeduction,
    grossAfterDeductions,
    cnssEmployee,
    amoEmployee,
    irWithheld,
    advancesDeducted: input.advancesCentimes,
    net,
    cnssEmployer,
    amoEmployer,
    totalEmployerCost,
  };
}

/** Moroccan IR progressive brackets (annual → monthly) */
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
