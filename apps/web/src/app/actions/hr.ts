"use server";

import { withTenant } from "@/lib/with-tenant";
import { advances, attendance, auditLogs, employees } from "@naql/db/schema";
import { and, between, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Employee Actions ─────────────────────────────────────────────────────────

const employeeCreateSchema = z.object({
  userId: z.string().optional(),
  fullName: z.string().min(2).max(100),
  role: z.string().min(1).max(60),
  baseSalary: z.number().int().positive(), // centimes
  contractType: z.enum(["cdi", "cdd", "interim"]).optional(),
  contractEndsAt: z.string().datetime().optional(),
  cnssNumber: z.string().max(20).optional(),
  licenseNumber: z.string().max(30).optional(),
  licenseExpiresAt: z.string().datetime().optional(),
});

export const createEmployee = withTenant(
  "hr:write",
  async ({ db, orgId, userId: actorId }, input: unknown) => {
    const data = employeeCreateSchema.parse(input);

    const [emp] = await db
      .insert(employees)
      .values({
        ...data,
        organizationId: orgId,
        contractEndsAt: data.contractEndsAt ? new Date(data.contractEndsAt) : undefined,
        licenseExpiresAt: data.licenseExpiresAt ? new Date(data.licenseExpiresAt) : undefined,
      })
      .returning();

    if (!emp) throw new Error("Insert failed");

    // Audit — salary is PII; logged only for owner/accountant who already have access
    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: actorId,
      entity: "employees",
      entityId: emp.id,
      action: "create",
      after: { ...emp, cnssNumber: "[REDACTED]", baseSalary: "[REDACTED]" },
    });

    revalidatePath("/hr/employees");
    return emp;
  }
);

export const updateEmployee = withTenant(
  "hr:write",
  async ({ db, orgId, userId: actorId }, input: unknown) => {
    const { id, ...data } = z
      .object({ id: z.string() })
      .merge(employeeCreateSchema.partial())
      .parse(input);

    const [before] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)));
    if (!before) throw new Error("Employee not found");

    const [updated] = await db
      .update(employees)
      .set({
        ...data,
        contractEndsAt: data.contractEndsAt ? new Date(data.contractEndsAt) : undefined,
        licenseExpiresAt: data.licenseExpiresAt ? new Date(data.licenseExpiresAt) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(employees.id, id), eq(employees.organizationId, orgId)))
      .returning();

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: actorId,
      entity: "employees",
      entityId: id,
      action: "update",
      before: { ...before, cnssNumber: "[REDACTED]" },
      after: { ...updated, cnssNumber: "[REDACTED]" },
    });

    revalidatePath("/hr/employees");
    return updated;
  }
);

export const listEmployees = withTenant("hr:read", async ({ db, orgId }) => {
  return db
    .select()
    .from(employees)
    .where(eq(employees.organizationId, orgId))
    .orderBy(employees.fullName);
});

// ─── Attendance Actions ───────────────────────────────────────────────────────

const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string().datetime(),
  status: z.enum(["present", "absent", "leave"]),
  hours: z.number().min(0).max(24).optional(),
});

export const recordAttendance = withTenant(
  "attendance:write",
  async ({ db, orgId, userId: actorId }, input: unknown) => {
    const data = attendanceSchema.parse(input);
    const dateVal = new Date(data.date);

    // Upsert: one record per employee per day
    await db
      .delete(attendance)
      .where(
        and(
          eq(attendance.organizationId, orgId),
          eq(attendance.employeeId, data.employeeId),
          sql`DATE(${attendance.date}) = DATE(${dateVal.toISOString()})`
        )
      );

    const [record] = await db
      .insert(attendance)
      .values({ ...data, organizationId: orgId, date: dateVal })
      .returning();

    if (!record) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: actorId,
      entity: "attendance",
      entityId: record.id,
      action: "create",
      after: record,
    });

    revalidatePath("/hr/attendance");
    return record;
  }
);

export const listAttendance = withTenant(
  "attendance:read",
  async ({ db, orgId }, input: unknown) => {
    const { employeeId, from, to } = z
      .object({
        employeeId: z.string().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
      .parse(input ?? {});

    let query = db.select().from(attendance).where(eq(attendance.organizationId, orgId)).$dynamic();

    if (employeeId) {
      query = query.where(eq(attendance.employeeId, employeeId));
    }
    if (from && to) {
      query = query.where(between(attendance.date, new Date(from), new Date(to)));
    }

    return query.orderBy(desc(attendance.date)).limit(500);
  }
);

// ─── Advances Actions ─────────────────────────────────────────────────────────

const advanceSchema = z.object({
  employeeId: z.string(),
  amount: z.number().int().positive(), // centimes
  grantedAt: z.string().datetime(),
});

export const createAdvance = withTenant(
  "advances:write",
  async ({ db, orgId, userId: actorId }, input: unknown) => {
    const data = advanceSchema.parse(input);

    const [advance] = await db
      .insert(advances)
      .values({ ...data, organizationId: orgId, grantedAt: new Date(data.grantedAt) })
      .returning();

    if (!advance) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: actorId,
      entity: "advances",
      entityId: advance.id,
      action: "create",
      after: { ...advance, amount: "[REDACTED]" }, // PII
    });

    revalidatePath("/hr/employees");
    return advance;
  }
);

export const repayAdvance = withTenant("advances:write", async ({ db, orgId }, input: unknown) => {
  const { id } = z.object({ id: z.string() }).parse(input);
  await db
    .update(advances)
    .set({ repaid: true })
    .where(and(eq(advances.id, id), eq(advances.organizationId, orgId)));
  revalidatePath("/hr/employees");
});

export const listAdvances = withTenant("advances:read", async ({ db, orgId }, input: unknown) => {
  const { employeeId } = z.object({ employeeId: z.string().optional() }).parse(input ?? {});
  return db
    .select()
    .from(advances)
    .where(
      employeeId
        ? and(eq(advances.organizationId, orgId), eq(advances.employeeId, employeeId))
        : eq(advances.organizationId, orgId)
    )
    .orderBy(desc(advances.grantedAt));
});
