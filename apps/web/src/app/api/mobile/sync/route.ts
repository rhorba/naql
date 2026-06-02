import { computeConsumption, detectAnomaly } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { alerts, attendance, employees, fuelLogs, missions } from "@naql/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { z } from "zod";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

// ─── Item schemas ─────────────────────────────────────────────────────────────

const missionUpdateSchema = z.object({
  entity: z.literal("mission_status"),
  idempotencyKey: z.string().min(1),
  missionId: z.string(),
  status: z.enum(["in_progress", "completed", "cancelled"]),
  proofOfDeliveryUrl: z.string().url().optional(),
  timestamp: z.number(),
});

const fuelLogSchema = z.object({
  entity: z.literal("fuel_log"),
  idempotencyKey: z.string().min(1),
  localId: z.string(),
  vehicleId: z.string(),
  missionId: z.string().optional(),
  litres: z.number().positive(),
  pricePerLitre: z.number().int().positive(),
  odometer: z.number().int().positive().optional(),
  station: z.string().max(100).optional(),
  filledAt: z.number(), // unix ms
  receiptUrl: z.string().url().optional(),
});

const attendanceSchema = z.object({
  entity: z.literal("attendance"),
  idempotencyKey: z.string().min(1),
  date: z.string(), // ISO date "2026-06-01"
  status: z.enum(["present", "absent", "leave"]),
  hours: z.number().min(0).max(24).optional(),
  timestamp: z.number(),
});

const syncItemSchema = z.discriminatedUnion("entity", [
  missionUpdateSchema,
  fuelLogSchema,
  attendanceSchema,
]);

const syncRequestSchema = z.object({
  items: z.array(syncItemSchema).max(100),
});

export type SyncItemResult = {
  idempotencyKey: string;
  status: "ok" | "skipped" | "error";
  error?: string;
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Verify JWT (driver token from /api/mobile/auth/login)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let driverUserId: string;
  let orgId: string;

  try {
    const { payload } = await jwtVerify(authHeader.slice(7), secret);
    if (payload.role !== "driver") {
      return NextResponse.json({ error: "Driver role required" }, { status: 403 });
    }
    driverUserId = payload.sub as string;
    orgId = payload.orgId as string;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = syncRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const results: SyncItemResult[] = [];

  await withOrgContext(db, orgId, async (tenantDb) => {
    for (const item of parsed.data.items) {
      try {
        const result = await processSyncItem(tenantDb, item, orgId, driverUserId);
        results.push({ idempotencyKey: item.idempotencyKey, ...result });
      } catch (err) {
        results.push({
          idempotencyKey: item.idempotencyKey,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  });

  // Return updated missions for the driver + any alerts
  const driverMissions = await withOrgContext(db, orgId, async (tenantDb) => {
    return tenantDb
      .select()
      .from(missions)
      .where(
        and(
          eq(missions.organizationId, orgId),
          eq(missions.driverId, driverUserId),
          sql`${missions.status} IN ('planned','in_progress')`
        )
      )
      .orderBy(missions.startDate);
  });

  return NextResponse.json({ results, missions: driverMissions });
}

// ─── Item processors ──────────────────────────────────────────────────────────

type SyncDb = Parameters<Parameters<typeof withOrgContext>[2]>[0];

async function processSyncItem(
  tenantDb: SyncDb,
  item: z.infer<typeof syncItemSchema>,
  orgId: string,
  driverUserId: string
): Promise<Omit<SyncItemResult, "idempotencyKey">> {
  if (item.entity === "mission_status") {
    // Driver can only update their own missions
    const [mission] = await tenantDb
      .select()
      .from(missions)
      .where(and(eq(missions.id, item.missionId), eq(missions.organizationId, orgId)));

    if (!mission) return { status: "error", error: "Mission not found" };
    if (mission.driverId !== driverUserId) {
      return { status: "error", error: "Not your mission" };
    }

    // Idempotency: if already in target status, skip
    if (mission.status === item.status) return { status: "skipped" };

    await tenantDb
      .update(missions)
      .set({
        status: item.status,
        proofOfDeliveryUrl: item.proofOfDeliveryUrl,
        endDate: item.status === "completed" ? new Date(item.timestamp) : undefined,
        updatedAt: new Date(item.timestamp),
      })
      .where(and(eq(missions.id, item.missionId), eq(missions.organizationId, orgId)));

    return { status: "ok" };
  }

  if (item.entity === "fuel_log") {
    // Idempotency: check if this localId already synced
    const [existing] = await tenantDb
      .select({ id: fuelLogs.id })
      .from(fuelLogs)
      .where(
        and(
          eq(fuelLogs.organizationId, orgId),
          sql`${fuelLogs.source} = 'driver_app'`,
          // Store localId in station field temporarily for idempotency check
          // In production, add a dedicated idempotency_key column
          sql`${fuelLogs.station} LIKE ${`localId:${item.localId}%`}`
        )
      )
      .limit(1);

    if (existing) return { status: "skipped" };

    const total = Math.round(item.litres * item.pricePerLitre);

    const [log] = await tenantDb
      .insert(fuelLogs)
      .values({
        organizationId: orgId,
        vehicleId: item.vehicleId,
        driverId: driverUserId,
        missionId: item.missionId,
        litres: item.litres,
        pricePerLitre: item.pricePerLitre,
        total,
        odometer: item.odometer,
        station: `localId:${item.localId}${item.station ? `|${item.station}` : ""}`,
        filledAt: new Date(item.filledAt),
        receiptUrl: item.receiptUrl,
        source: "driver_app",
      })
      .returning({ id: fuelLogs.id, vehicleId: fuelLogs.vehicleId });

    // Trigger over-consumption check if odometer provided
    if (item.odometer && log) {
      await checkDriverOverConsumption(
        tenantDb,
        orgId,
        log.id,
        log.vehicleId,
        item.litres,
        item.odometer
      );
    }

    return { status: "ok" };
  }

  if (item.entity === "attendance") {
    // Find employee record for this driver
    const [emp] = await tenantDb
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.userId, driverUserId), eq(employees.organizationId, orgId)));

    if (!emp) return { status: "error", error: "No employee record for driver" };

    const dateVal = new Date(item.date);

    // Upsert: last-write-wins per day
    await tenantDb
      .delete(attendance)
      .where(
        and(
          eq(attendance.organizationId, orgId),
          eq(attendance.employeeId, emp.id),
          sql`DATE(${attendance.date}) = ${item.date}`
        )
      );

    await tenantDb.insert(attendance).values({
      organizationId: orgId,
      employeeId: emp.id,
      date: dateVal,
      status: item.status,
      hours: item.hours,
    });

    return { status: "ok" };
  }

  return { status: "error", error: "Unknown entity" };
}

async function checkDriverOverConsumption(
  tenantDb: SyncDb,
  orgId: string,
  logId: string,
  vehicleId: string,
  litres: number,
  currentOdometer: number
) {
  const { vehicles } = await import("@naql/db/schema");
  const { desc } = await import("drizzle-orm");

  const [prev] = await tenantDb
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

  const [vehicle] = await tenantDb
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
    await tenantDb
      .delete(alerts)
      .where(
        and(
          eq(alerts.organizationId, orgId),
          eq(alerts.kind, "over_consumption"),
          eq(alerts.entityId, vehicleId),
          isNull(alerts.resolvedAt)
        )
      );
    await tenantDb.insert(alerts).values({
      organizationId: orgId,
      kind: "over_consumption",
      entityId: vehicleId,
      message: `Véhicule ${vehicle?.code ?? vehicleId}: ${anomaly.actualLPer100km.toFixed(1)} L/100km (+${anomaly.deviationPct.toFixed(0)}%)`,
      severity: anomaly.severity,
    });
  }
}
