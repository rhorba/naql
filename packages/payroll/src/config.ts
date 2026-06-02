import type { Money } from "@naql/core";

/**
 * Configurable Moroccan payroll parameters.
 * Defaults reflect 2026 CNSS/DGI published rates.
 * Override per-org if the government updates the schedule.
 */
export interface PayrollConfig {
  /** CNSS employee contribution rate (default 4.48%) */
  cnssEmployeeRate: number;
  /** CNSS employer contribution rate (default 21.09%) */
  cnssEmployerRate: number;
  /** CNSS monthly ceiling in centimes (default 6,000 MAD) */
  cnssCeilingCentimes: Money;
  /** AMO (health insurance) employee rate (default 2.26%) */
  amoEmployeeRate: number;
  /** AMO employer rate (default 4.11%) */
  amoEmployerRate: number;
}

export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  cnssEmployeeRate: 0.0448,
  cnssEmployerRate: 0.2109,
  cnssCeilingCentimes: 600_000 as Money, // 6,000 MAD × 100
  amoEmployeeRate: 0.0226,
  amoEmployerRate: 0.0411,
};
