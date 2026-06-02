/**
 * Consumption engine — S2-04 + S2-05
 *
 * DistanceSource abstraction: in v0.1 distance = odometer delta.
 * In v0.2 GPS replaces this transparently.
 */

export type DistanceSource = "odometer" | "gps"; // gps reserved for v0.2

export interface ConsumptionEntry {
  vehicleId: string;
  litres: number;
  odometerStart: number; // km
  odometerEnd: number; // km
  source: DistanceSource;
}

export interface ConsumptionResult {
  vehicleId: string;
  distanceKm: number;
  litres: number;
  lPer100km: number; // L/100km
  source: DistanceSource;
  /** true if odometer delta looks implausible (negative or > 5000km) */
  odometerSuspect: boolean;
}

/** Compute L/100km from a fuel fill + odometer pair. */
export function computeConsumption(entry: ConsumptionEntry): ConsumptionResult {
  const distanceKm = entry.odometerEnd - entry.odometerStart;
  const odometerSuspect = distanceKm <= 0 || distanceKm > 5000;
  const lPer100km = odometerSuspect || distanceKm === 0 ? 0 : (entry.litres / distanceKm) * 100;

  return {
    vehicleId: entry.vehicleId,
    distanceKm: odometerSuspect ? 0 : distanceKm,
    litres: entry.litres,
    lPer100km: Math.round(lPer100km * 100) / 100,
    source: entry.source,
    odometerSuspect,
  };
}

export interface AnomalyResult {
  vehicleId: string;
  baselineLPer100km: number;
  actualLPer100km: number;
  deviationPct: number; // positive = over-consumption
  extraLitres: number; // litres above baseline for this fill
  severity: "normal" | "warning" | "critical"; // >15% = warning, >30% = critical
  needsReview: boolean; // true if odometer suspect — don't flag as anomaly
}

/** Compare actual consumption vs baseline. Returns anomaly rating. */
export function detectAnomaly(result: ConsumptionResult, baselineLPer100km: number): AnomalyResult {
  if (result.odometerSuspect || baselineLPer100km <= 0 || result.distanceKm <= 0) {
    return {
      vehicleId: result.vehicleId,
      baselineLPer100km,
      actualLPer100km: result.lPer100km,
      deviationPct: 0,
      extraLitres: 0,
      severity: "normal",
      needsReview: result.odometerSuspect,
    };
  }

  const deviationPct = ((result.lPer100km - baselineLPer100km) / baselineLPer100km) * 100;
  const extraLitres = ((result.lPer100km - baselineLPer100km) / 100) * result.distanceKm;

  const severity: AnomalyResult["severity"] =
    deviationPct >= 30 ? "critical" : deviationPct >= 15 ? "warning" : "normal";

  return {
    vehicleId: result.vehicleId,
    baselineLPer100km,
    actualLPer100km: result.lPer100km,
    deviationPct: Math.round(deviationPct * 10) / 10,
    extraLitres: Math.round(extraLitres * 10) / 10,
    severity,
    needsReview: false,
  };
}

/**
 * Rank a list of anomalies by impact (extraLitres × severity weight).
 * This is the "over-consumption ranking" that beats the incumbent's basic flag.
 */
export function rankAnomalies(anomalies: AnomalyResult[]): AnomalyResult[] {
  const weight = { normal: 0, warning: 1, critical: 2 } as const;
  return [...anomalies]
    .filter((a) => a.severity !== "normal" && !a.needsReview)
    .sort((a, b) => {
      const scoreA = a.extraLitres * weight[a.severity];
      const scoreB = b.extraLitres * weight[b.severity];
      return scoreB - scoreA;
    });
}
