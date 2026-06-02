"use server";

import { withTenant } from "@/lib/with-tenant";
import { computeConsumption, detectAnomaly } from "@naql/core";
import type { AnomalyResult } from "@naql/core";
import { alerts, auditLogs, fuelLogs, vehicles } from "@naql/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const fuelLogCreateSchema = z.object({
  vehicleId: z.string().min(1),
  missionId: z.string().optional(),
  litres: z.number().positive(),
  pricePerLitre: z.number().int().positive(),
  odometer: z.number().int().positive().optional(),
  station: z.string().max(100).optional(),
  filledAt: z.string().datetime(),
  receiptUrl: z.string().url().optional(),
});

export const createFuelLog = withTenant(
  "fuel:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = fuelLogCreateSchema.parse(input);
    const total = Math.round(data.litres * data.pricePerLitre);

    const [log] = await db
      .insert(fuelLogs)
      .values({
        ...data,
        organizationId: orgId,
        total,
        filledAt: new Date(data.filledAt),
        source: "desktop",
      })
      .returning();

    if (!log) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "fuel_logs",
      entityId: log.id,
      action: "create",
      after: log,
    });

    // Check for over-consumption if odometer is provided
    if (data.odometer && data.odometer > 0) {
      await checkOverConsumption(db, orgId, log.id, data.vehicleId, data.litres, data.odometer);
    }

    revalidatePath("/fuel");
    return log;
  }
);

export const listFuelLogs = withTenant(null, async ({ db, orgId }, input: unknown) => {
  const { vehicleId, limit } = z
    .object({ vehicleId: z.string().optional(), limit: z.number().int().max(500).default(100) })
    .parse(input ?? {});

  return db
    .select()
    .from(fuelLogs)
    .where(
      vehicleId
        ? and(eq(fuelLogs.organizationId, orgId), eq(fuelLogs.vehicleId, vehicleId))
        : eq(fuelLogs.organizationId, orgId)
    )
    .orderBy(desc(fuelLogs.filledAt))
    .limit(limit);
});

/**
 * Return ranked over-consumption anomalies across all vehicles.
 * Uses the last two consecutive odometer readings per vehicle.
 */
export const getConsumptionRanking = withTenant(null, async ({ db, orgId }) => {
  // Pull last 60 days of fuel logs with odometer readings, ordered per vehicle
  const logs = await db
    .select({
      id: fuelLogs.id,
      vehicleId: fuelLogs.vehicleId,
      litres: fuelLogs.litres,
      odometer: fuelLogs.odometer,
      filledAt: fuelLogs.filledAt,
    })
    .from(fuelLogs)
    .where(
      and(
        eq(fuelLogs.organizationId, orgId),
        sql`${fuelLogs.odometer} IS NOT NULL`,
        sql`${fuelLogs.filledAt} > NOW() - INTERVAL '60 days'`
      )
    )
    .orderBy(fuelLogs.vehicleId, fuelLogs.filledAt);

  // Get vehicle baselines
  const vehicleList = await db.select().from(vehicles).where(eq(vehicles.organizationId, orgId));
  const baselineMap = new Map(vehicleList.map((v) => [v.id, v.baselineConsumption ?? 0]));

  // Compute consumption for consecutive pairs per vehicle
  const anomalies: AnomalyResult[] = [];
  const byVehicle = new Map<string, typeof logs>();

  for (const log of logs) {
    const arr = byVehicle.get(log.vehicleId) ?? [];
    arr.push(log);
    byVehicle.set(log.vehicleId, arr);
  }

  for (const [vehicleId, vehicleLogs] of byVehicle) {
    const baseline = baselineMap.get(vehicleId) ?? 0;
    if (baseline <= 0 || vehicleLogs.length < 2) continue;

    for (let i = 1; i < vehicleLogs.length; i++) {
      const prev = vehicleLogs[i - 1];
      const curr = vehicleLogs[i];
      if (!prev?.odometer || !curr?.odometer) continue;

      const result = computeConsumption({
        vehicleId,
        litres: curr.litres,
        odometerStart: prev.odometer,
        odometerEnd: curr.odometer,
        source: "odometer",
      });

      const anomaly = detectAnomaly(result, baseline);
      if (anomaly.severity !== "normal" || anomaly.needsReview) {
        anomalies.push(anomaly);
      }
    }
  }

  // Import ranking function
  const { rankAnomalies } = await import("@naql/core");
  return rankAnomalies(anomalies);
});

// ─── Internal helper ──────────────────────────────────────────────────────────

async function checkOverConsumption(
  db: Parameters<Parameters<typeof withTenant>[1]>[0]["db"],
  orgId: string,
  logId: string,
  vehicleId: string,
  litres: number,
  currentOdometer: number
) {
  // Get previous odometer reading for this vehicle
  const [prev] = await db
    .select({ odometer: fuelLogs.odometer })
    .from(fuelLogs)
    .where(
      and(
        eq(fuelLogs.organizationId, orgId),
        eq(fuelLogs.vehicleId, vehicleId),
        sql`${fuelLogs.odometer} IS NOT NULL`,
        sql`id != ${logId}`
      )
    )
    .orderBy(desc(fuelLogs.filledAt))
    .limit(1);

  if (!prev?.odometer) return;

  const [vehicle] = await db
    .select({ baselineConsumption: vehicles.baselineConsumption, code: vehicles.code })
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.organizationId, orgId)));

  const baseline = vehicle?.baselineConsumption ?? 0;
  if (baseline <= 0) return;

  const result = computeConsumption({
    vehicleId,
    litres,
    odometerStart: prev.odometer,
    odometerEnd: currentOdometer,
    source: "odometer",
  });

  const anomaly = detectAnomaly(result, baseline);

  if (anomaly.severity !== "normal" && !anomaly.needsReview) {
    // Upsert over-consumption alert
    await db
      .delete(alerts)
      .where(
        and(
          eq(alerts.organizationId, orgId),
          eq(alerts.kind, "over_consumption"),
          eq(alerts.entityId, vehicleId),
          isNull(alerts.resolvedAt)
        )
      );

    await db.insert(alerts).values({
      organizationId: orgId,
      kind: "over_consumption",
      entityId: vehicleId,
      message: `Véhicule ${vehicle?.code ?? vehicleId}: ${anomaly.actualLPer100km.toFixed(1)} L/100km (base: ${baseline} L/100km, +${anomaly.deviationPct.toFixed(0)}%)`,
      severity: anomaly.severity,
    });
  }
}
