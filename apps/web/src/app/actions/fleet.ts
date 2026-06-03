"use server";

import { withTenant } from "@/lib/with-tenant";
import { auditLogs, vehicleDocuments, vehicles } from "@naql/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas ────────────────────────────────────────────────────────────────

const vehicleCreateSchema = z.object({
  code: z.string().min(1).max(20),
  registration: z.string().min(1).max(30),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  year: z.number().int().min(1980).max(2030).optional(),
  type: z.enum(["truck", "van", "trailer", "other"]).optional(),
  capacityKg: z.number().positive().optional(),
  baselineConsumption: z.number().positive().optional(),
});

const vehicleUpdateSchema = vehicleCreateSchema.partial().extend({
  status: z.enum(["available", "on_mission", "maintenance", "out_of_service"]).optional(),
});

const documentCreateSchema = z.object({
  vehicleId: z.string().uuid(),
  kind: z.enum(["insurance", "technical_inspection", "license", "other"]),
  reference: z.string().max(100).optional(),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  fileUrl: z.string().url().optional(),
});

// ─── Vehicle Actions ─────────────────────────────────────────────────────────

export const createVehicle = withTenant(
  "fleet:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = vehicleCreateSchema.parse(input);

    const [vehicle] = await db
      .insert(vehicles)
      .values({ ...data, organizationId: orgId })
      .returning();

    if (!vehicle) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "vehicles",
      entityId: vehicle.id,
      action: "create",
      after: vehicle,
    });

    revalidatePath("/fleet");
    return vehicle;
  }
);

export const updateVehicle = withTenant(
  "fleet:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const { id, ...data } = z.object({ id: z.string() }).merge(vehicleUpdateSchema).parse(input);

    const [before] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.organizationId, orgId)));
    if (!before) throw new Error("Vehicle not found");

    const [updated] = await db
      .update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(vehicles.id, id), eq(vehicles.organizationId, orgId)))
      .returning();

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "vehicles",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });

    revalidatePath("/fleet");
    if (!updated) throw new Error("Update failed");
    return updated;
  }
);

export const deleteVehicle = withTenant(
  "fleet:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const { id } = z.object({ id: z.string() }).parse(input);

    const [before] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.organizationId, orgId)));
    if (!before) throw new Error("Vehicle not found");

    await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.organizationId, orgId)));

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "vehicles",
      entityId: id,
      action: "delete",
      before,
    });

    revalidatePath("/fleet");
  }
);

export const listVehicles = withTenant(null, async ({ db }) => {
  return db.select().from(vehicles).orderBy(vehicles.code);
});

export const getVehicle = withTenant(null, async ({ db, orgId }, input: unknown) => {
  const { id } = z.object({ id: z.string() }).parse(input);
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.organizationId, orgId)));
  return vehicle ?? null;
});

// ─── Document Actions ────────────────────────────────────────────────────────

export const createDocument = withTenant(
  "fleet:documents:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = documentCreateSchema.parse(input);

    const [doc] = await db
      .insert(vehicleDocuments)
      .values({
        ...data,
        organizationId: orgId,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        expiresAt: new Date(data.expiresAt),
      })
      .returning();

    if (!doc) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "vehicle_documents",
      entityId: doc.id,
      action: "create",
      after: doc,
    });

    revalidatePath("/fleet");
    return doc;
  }
);

export const listDocuments = withTenant("fleet:documents:read", async ({ db }, input: unknown) => {
  const { vehicleId } = z.object({ vehicleId: z.string() }).parse(input);
  return db
    .select()
    .from(vehicleDocuments)
    .where(eq(vehicleDocuments.vehicleId, vehicleId))
    .orderBy(vehicleDocuments.expiresAt);
});
