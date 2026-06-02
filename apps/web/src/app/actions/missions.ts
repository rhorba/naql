"use server";

import { withTenant } from "@/lib/with-tenant";
import { auditLogs, missions, vehicles } from "@naql/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const missionCreateSchema = z.object({
  clientId: z.string().min(1),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  originCity: z.string().min(1).max(100),
  destinationCity: z.string().min(1).max(100),
  cargo: z.string().max(200).optional(),
  agreedPrice: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

// Valid status transitions (state machine)
const TRANSITIONS: Record<string, string[]> = {
  planned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["invoiced"],
  invoiced: [],
  cancelled: [],
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export const createMission = withTenant(
  "missions:create",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = missionCreateSchema.parse(input);

    const [mission] = await db
      .insert(missions)
      .values({
        ...data,
        organizationId: orgId,
        agreedPrice: data.agreedPrice,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: "planned",
      })
      .returning();

    if (!mission) throw new Error("Insert failed");

    // Mark vehicle on_mission if assigned
    if (data.vehicleId) {
      await db
        .update(vehicles)
        .set({ status: "on_mission", updatedAt: new Date() })
        .where(and(eq(vehicles.id, data.vehicleId), eq(vehicles.organizationId, orgId)));
    }

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "missions",
      entityId: mission.id,
      action: "create",
      after: mission,
    });

    revalidatePath("/missions");
    return mission;
  }
);

export const transitionMission = withTenant(
  "missions:update_status",
  async ({ db, orgId, userId, role }, input: unknown) => {
    const { id, status } = z
      .object({
        id: z.string(),
        status: z.enum(["in_progress", "completed", "invoiced", "cancelled"]),
      })
      .parse(input);

    const [mission] = await db
      .select()
      .from(missions)
      .where(and(eq(missions.id, id), eq(missions.organizationId, orgId)));

    if (!mission) throw new Error("Mission not found");

    // Drivers can only update their own missions
    if (role === "driver" && mission.driverId !== userId) {
      throw new Error("Forbidden: can only update own missions");
    }

    if (!TRANSITIONS[mission.status]?.includes(status)) {
      throw new Error(`Invalid transition: ${mission.status} → ${status}`);
    }

    const update: Partial<typeof missions.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "completed") update.endDate = new Date();

    const [updated] = await db
      .update(missions)
      .set(update)
      .where(and(eq(missions.id, id), eq(missions.organizationId, orgId)))
      .returning();

    // Release vehicle when mission completes or is cancelled
    if ((status === "completed" || status === "cancelled") && mission.vehicleId) {
      await db
        .update(vehicles)
        .set({ status: "available", updatedAt: new Date() })
        .where(and(eq(vehicles.id, mission.vehicleId), eq(vehicles.organizationId, orgId)));
    }

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "missions",
      entityId: id,
      action: "update",
      before: mission,
      after: updated,
    });

    revalidatePath("/missions");
    return updated;
  }
);

export const assignMission = withTenant(
  "missions:assign",
  async ({ db, orgId, userId }, input: unknown) => {
    const { id, vehicleId, driverId } = z
      .object({
        id: z.string(),
        vehicleId: z.string().optional(),
        driverId: z.string().optional(),
      })
      .parse(input);

    const [before] = await db
      .select()
      .from(missions)
      .where(and(eq(missions.id, id), eq(missions.organizationId, orgId)));

    if (!before) throw new Error("Mission not found");
    if (before.status !== "planned") throw new Error("Can only assign planned missions");

    // Check driver license expiry (S4-07: warn at assignment)
    if (driverId) {
      const { employees } = await import("@naql/db/schema");
      const { eq: eqFn } = await import("drizzle-orm");
      const [emp] = await db
        .select({ licenseExpiresAt: employees.licenseExpiresAt })
        .from(employees)
        .where(and(eqFn(employees.userId, driverId), eqFn(employees.organizationId, orgId)));
      if (emp?.licenseExpiresAt && emp.licenseExpiresAt < new Date()) {
        throw new Error("Driver license expired — cannot assign to mission");
      }
    }

    // Release old vehicle if changing
    if (before.vehicleId && before.vehicleId !== vehicleId) {
      await db
        .update(vehicles)
        .set({ status: "available", updatedAt: new Date() })
        .where(and(eq(vehicles.id, before.vehicleId), eq(vehicles.organizationId, orgId)));
    }

    const [updated] = await db
      .update(missions)
      .set({ vehicleId, driverId, updatedAt: new Date() })
      .where(and(eq(missions.id, id), eq(missions.organizationId, orgId)))
      .returning();

    // Mark new vehicle on_mission
    if (vehicleId) {
      await db
        .update(vehicles)
        .set({ status: "on_mission", updatedAt: new Date() })
        .where(and(eq(vehicles.id, vehicleId), eq(vehicles.organizationId, orgId)));
    }

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "missions",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });

    revalidatePath("/missions");
    return updated;
  }
);

export const listMissions = withTenant(null, async ({ db, orgId }, input: unknown) => {
  const { status } = z.object({ status: z.string().optional() }).parse(input ?? {});
  const query = db
    .select()
    .from(missions)
    .where(
      status
        ? and(eq(missions.organizationId, orgId), sql`${missions.status} = ${status}`)
        : eq(missions.organizationId, orgId)
    )
    .orderBy(missions.startDate);
  return query;
});

export const getMission = withTenant(null, async ({ db, orgId }, input: unknown) => {
  const { id } = z.object({ id: z.string() }).parse(input);
  const [m] = await db
    .select()
    .from(missions)
    .where(and(eq(missions.id, id), eq(missions.organizationId, orgId)));
  return m ?? null;
});
