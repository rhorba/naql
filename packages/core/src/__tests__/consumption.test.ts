import { describe, expect, it } from "vitest";
import { computeConsumption, detectAnomaly, rankAnomalies } from "../consumption";

describe("computeConsumption", () => {
  it("computes L/100km correctly", () => {
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 28,
      odometerStart: 1000,
      odometerEnd: 1100,
      source: "odometer",
    });
    expect(r.lPer100km).toBe(28); // 28L / 100km = 28 L/100
    expect(r.distanceKm).toBe(100);
    expect(r.odometerSuspect).toBe(false);
  });

  it("flags negative odometer delta as suspect", () => {
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 50,
      odometerStart: 2000,
      odometerEnd: 1500, // went backwards
      source: "odometer",
    });
    expect(r.odometerSuspect).toBe(true);
    expect(r.lPer100km).toBe(0);
  });

  it("flags > 5000km delta as suspect", () => {
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 100,
      odometerStart: 1000,
      odometerEnd: 7000, // implausible for a single fill
      source: "odometer",
    });
    expect(r.odometerSuspect).toBe(true);
  });

  it("rounds L/100km to 2 decimal places", () => {
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 33.5,
      odometerStart: 500,
      odometerEnd: 630,
      source: "odometer",
    });
    // 33.5 / 130 * 100 = 25.769... → 25.77
    expect(r.lPer100km).toBeCloseTo(25.77, 1);
  });
});

describe("detectAnomaly", () => {
  const baseline = 22; // L/100km (a van)

  it("no anomaly when within 15%", () => {
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 24,
      odometerStart: 0,
      odometerEnd: 100,
      source: "odometer",
    });
    const a = detectAnomaly(r, baseline);
    expect(a.severity).toBe("normal");
  });

  it("warning when 15–30% over baseline", () => {
    // 22 * 1.20 = 26.4 L/100 → 20/100*100 = 26.4L for 100km
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 26.4,
      odometerStart: 0,
      odometerEnd: 100,
      source: "odometer",
    });
    const a = detectAnomaly(r, baseline);
    expect(a.severity).toBe("warning");
    expect(a.deviationPct).toBeGreaterThan(15);
    expect(a.deviationPct).toBeLessThanOrEqual(30);
  });

  it("critical when > 30% over baseline", () => {
    // 22 * 1.40 = 30.8 L/100
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 30.8,
      odometerStart: 0,
      odometerEnd: 100,
      source: "odometer",
    });
    const a = detectAnomaly(r, baseline);
    expect(a.severity).toBe("critical");
  });

  it("marks needsReview when odometer suspect — not a false anomaly", () => {
    const r = computeConsumption({
      vehicleId: "v1",
      litres: 200, // huge
      odometerStart: 2000,
      odometerEnd: 1000, // backwards
      source: "odometer",
    });
    const a = detectAnomaly(r, baseline);
    expect(a.needsReview).toBe(true);
    expect(a.severity).toBe("normal"); // not flagged as anomaly
  });
});

describe("rankAnomalies", () => {
  it("ranks by severity × extra litres, excludes normal + needsReview", () => {
    const result = rankAnomalies([
      {
        vehicleId: "v-warning-small",
        baselineLPer100km: 22,
        actualLPer100km: 26,
        deviationPct: 18,
        extraLitres: 2,
        severity: "warning",
        needsReview: false,
      },
      {
        vehicleId: "v-critical-large",
        baselineLPer100km: 22,
        actualLPer100km: 35,
        deviationPct: 59,
        extraLitres: 13,
        severity: "critical",
        needsReview: false,
      },
      {
        vehicleId: "v-normal",
        baselineLPer100km: 22,
        actualLPer100km: 23,
        deviationPct: 4,
        extraLitres: 0.5,
        severity: "normal",
        needsReview: false,
      },
      {
        vehicleId: "v-suspect",
        baselineLPer100km: 22,
        actualLPer100km: 0,
        deviationPct: 0,
        extraLitres: 0,
        severity: "normal",
        needsReview: true,
      },
    ]);

    expect(result).toHaveLength(2); // excludes normal + needsReview
    expect(result[0]?.vehicleId).toBe("v-critical-large"); // highest score
    expect(result[1]?.vehicleId).toBe("v-warning-small");
  });
});
