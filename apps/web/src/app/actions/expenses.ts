"use server";

import { withTenant } from "@/lib/with-tenant";
import { auditLogs, expenses, payments } from "@naql/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const expenseSchema = z.object({
  vehicleId: z.string().optional(),
  category: z.enum(["fuel", "maintenance", "tolls", "salary", "admin", "other"]),
  amount: z.number().int().positive(), // centimes
  spentAt: z.string().datetime(),
  receiptUrl: z.string().url().optional(),
  description: z.string().max(200).optional(),
});

export const createExpense = withTenant(
  "expenses:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = expenseSchema.parse(input);

    const [expense] = await db
      .insert(expenses)
      .values({
        ...data,
        organizationId: orgId,
        spentAt: new Date(data.spentAt),
        source: "manual",
      })
      .returning();

    if (!expense) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "expenses",
      entityId: expense.id,
      action: "create",
      after: expense,
    });

    revalidatePath("/expenses");
    return expense;
  }
);

export const listExpenses = withTenant(null, async ({ db, orgId }, input: unknown) => {
  const { category } = z.object({ category: z.string().optional() }).parse(input ?? {});
  return db
    .select()
    .from(expenses)
    .where(
      category
        ? and(eq(expenses.organizationId, orgId), eq(expenses.category, category as "fuel"))
        : eq(expenses.organizationId, orgId)
    )
    .orderBy(desc(expenses.spentAt))
    .limit(200);
});

export const listCashMovements = withTenant(null, async ({ db, orgId }) => {
  return db
    .select()
    .from(payments)
    .where(and(eq(payments.organizationId, orgId), eq(payments.method, "cash")))
    .orderBy(desc(payments.paidAt))
    .limit(200);
});

export const listBankMovements = withTenant(null, async ({ db, orgId }) => {
  return db
    .select()
    .from(payments)
    .where(and(eq(payments.organizationId, orgId), eq(payments.method, "bank")))
    .orderBy(desc(payments.paidAt))
    .limit(200);
});
