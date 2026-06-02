"use server";

import { withTenant } from "@/lib/with-tenant";
import { allocateInvoiceNumber } from "@naql/billing";
import { buildCreditNoteTotals, computeInvoiceTotals } from "@naql/billing";
import type { Money } from "@naql/core";
import { auditLogs, clients, invoices, missions, payments } from "@naql/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const invoiceLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().int().positive(), // centimes
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  missionId: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1),
  vatRate: z.number().int().min(0).max(100).default(20),
  dueDate: z.string().datetime().optional(),
  locale: z.enum(["fr", "ar"]).default("fr"),
});

// ─── Invoice Actions ──────────────────────────────────────────────────────────

export const createInvoice = withTenant(
  "invoices:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = createInvoiceSchema.parse(input);
    const year = new Date().getFullYear();

    const totals = computeInvoiceTotals(
      data.lines.map((l) => ({ ...l, unitPrice: l.unitPrice as Money })),
      data.vatRate
    );

    const number = await allocateInvoiceNumber(db, orgId, year);

    const [invoice] = await db
      .insert(invoices)
      .values({
        organizationId: orgId,
        clientId: data.clientId,
        number,
        issueDate: new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        lines: totals.lines,
        subtotal: totals.subtotal,
        vatRate: totals.vatRate / 100,
        vatAmount: totals.vatAmount,
        total: totals.total,
        status: "draft",
      })
      .returning();

    if (!invoice) throw new Error("Insert failed");

    // Link mission to invoiced status
    if (data.missionId) {
      await db
        .update(missions)
        .set({ status: "invoiced", updatedAt: new Date() })
        .where(and(eq(missions.id, data.missionId), eq(missions.organizationId, orgId)));
    }

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "invoices",
      entityId: invoice.id,
      action: "create",
      after: invoice,
    });

    revalidatePath("/invoicing");
    return invoice;
  }
);

export const sendInvoice = withTenant(
  "invoices:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const { id } = z.object({ id: z.string() }).parse(input);

    const [inv] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)));

    if (!inv) throw new Error("Invoice not found");
    if (inv.status !== "draft") throw new Error("Only draft invoices can be sent");

    const [updated] = await db
      .update(invoices)
      .set({ status: "sent", updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)))
      .returning();

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "invoices",
      entityId: id,
      action: "update",
      before: inv,
      after: updated,
    });

    revalidatePath("/invoicing");
    return updated;
  }
);

/** Issue a credit note — a new invoice with negated amounts */
export const createCreditNote = withTenant(
  "invoices:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const { originalId } = z.object({ originalId: z.string() }).parse(input);

    const [original] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, originalId), eq(invoices.organizationId, orgId)));

    if (!original) throw new Error("Original invoice not found");
    if (!["sent", "partial", "paid", "overdue"].includes(original.status)) {
      throw new Error("Can only credit-note a sent/partial/paid invoice");
    }

    const origTotals = {
      lines: (
        original.lines as {
          description: string;
          quantity: number;
          unitPrice: number;
          amount: number;
        }[]
      ).map((l) => ({ ...l, unitPrice: l.unitPrice as Money, amount: l.amount as Money })),
      subtotal: original.subtotal as Money,
      vatRate: Math.round(original.vatRate * 100),
      vatAmount: original.vatAmount as Money,
      total: original.total as Money,
    };

    const creditTotals = buildCreditNoteTotals(origTotals);
    const year = new Date().getFullYear();
    const number = await allocateInvoiceNumber(db, orgId, year);

    const [creditNote] = await db
      .insert(invoices)
      .values({
        organizationId: orgId,
        clientId: original.clientId,
        number,
        issueDate: new Date(),
        lines: creditTotals.lines,
        subtotal: creditTotals.subtotal,
        vatRate: creditTotals.vatRate / 100,
        vatAmount: creditTotals.vatAmount,
        total: creditTotals.total,
        status: "sent",
      })
      .returning();

    if (!creditNote) throw new Error("Insert failed");

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "invoices",
      entityId: creditNote.id,
      action: "create",
      after: { ...creditNote, creditNoteFor: originalId },
    });

    revalidatePath("/invoicing");
    return creditNote;
  }
);

export const listInvoices = withTenant(null, async ({ db, orgId }) => {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.organizationId, orgId))
    .orderBy(invoices.issueDate);
});

// ─── Payment Actions ──────────────────────────────────────────────────────────

const createPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().int().positive(), // centimes
  method: z.enum(["cash", "bank", "cheque", "other"]),
  paidAt: z.string().datetime(),
});

export const createPayment = withTenant(
  "payments:write",
  async ({ db, orgId, userId }, input: unknown) => {
    const data = createPaymentSchema.parse(input);

    const [inv] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, data.invoiceId), eq(invoices.organizationId, orgId)));

    if (!inv) throw new Error("Invoice not found");
    if (["paid", "cancelled", "draft"].includes(inv.status)) {
      throw new Error(`Cannot add payment to ${inv.status} invoice`);
    }

    const [payment] = await db
      .insert(payments)
      .values({
        organizationId: orgId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        paidAt: new Date(data.paidAt),
      })
      .returning();

    if (!payment) throw new Error("Insert failed");

    // Recalculate invoice status
    const allPayments = await db
      .select({ amount: payments.amount })
      .from(payments)
      .where(and(eq(payments.invoiceId, data.invoiceId), eq(payments.organizationId, orgId)));

    const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
    const newStatus = totalPaid >= inv.total ? "paid" : totalPaid > 0 ? "partial" : inv.status;

    await db
      .update(invoices)
      .set({ status: newStatus as typeof inv.status, updatedAt: new Date() })
      .where(and(eq(invoices.id, data.invoiceId), eq(invoices.organizationId, orgId)));

    // Update client outstanding balance
    await db
      .update(clients)
      .set({
        outstandingBalance: sql`${clients.outstandingBalance} - ${data.amount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, inv.clientId), eq(clients.organizationId, orgId)));

    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorUserId: userId,
      entity: "payments",
      entityId: payment.id,
      action: "create",
      after: payment,
    });

    revalidatePath("/invoicing");
    revalidatePath("/payments");
    return payment;
  }
);

export const listPayments = withTenant(null, async ({ db, orgId }) => {
  return db
    .select()
    .from(payments)
    .where(eq(payments.organizationId, orgId))
    .orderBy(payments.paidAt);
});
