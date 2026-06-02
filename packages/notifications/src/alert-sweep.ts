import type { Database } from "@naql/db";
import { alerts, employees, invoices, vehicleDocuments } from "@naql/db/schema";
import { and, isNull, lte, sql } from "drizzle-orm";

const DAYS_WARNING = 30;

/**
 * Run alert sweep for one org: check document expiry, contract renewals,
 * overdue invoices. Inserts deduped alert rows (one per org/kind/entity).
 */
export async function runAlertSweep(db: Database, organizationId: string) {
  const now = new Date();
  const warningDate = new Date(now.getTime() + DAYS_WARNING * 24 * 60 * 60 * 1000);

  const created: string[] = [];

  // 1. Vehicle document expiry
  const expiringDocs = await db
    .select({
      id: vehicleDocuments.id,
      kind: vehicleDocuments.kind,
      expiresAt: vehicleDocuments.expiresAt,
    })
    .from(vehicleDocuments)
    .where(lte(vehicleDocuments.expiresAt, warningDate));

  for (const doc of expiringDocs) {
    const daysLeft = Math.ceil((doc.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const severity = daysLeft <= 0 ? "critical" : daysLeft <= 7 ? "warning" : "info";
    const message =
      daysLeft <= 0
        ? `Document ${doc.kind} expiré depuis ${Math.abs(daysLeft)} jour(s)`
        : `Document ${doc.kind} expire dans ${daysLeft} jour(s)`;

    await upsertAlert(db, {
      organizationId,
      kind: "document_expiry",
      entityId: doc.id,
      message,
      severity,
    });
    created.push(doc.id);
  }

  // 2. Contract renewals
  const expiringContracts = await db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      contractEndsAt: employees.contractEndsAt,
    })
    .from(employees)
    .where(
      and(sql`${employees.contractEndsAt} IS NOT NULL`, lte(employees.contractEndsAt, warningDate))
    );

  for (const emp of expiringContracts) {
    if (!emp.contractEndsAt) continue;
    const daysLeft = Math.ceil(
      (emp.contractEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const severity = daysLeft <= 0 ? "critical" : "warning";
    const message =
      daysLeft <= 0
        ? `Contrat de ${emp.fullName} expiré`
        : `Contrat de ${emp.fullName} expire dans ${daysLeft} jour(s)`;

    await upsertAlert(db, {
      organizationId,
      kind: "contract_renewal",
      entityId: emp.id,
      message,
      severity,
    });
    created.push(emp.id);
  }

  // 3. Overdue invoices
  const overdueInvoices = await db
    .select({ id: invoices.id, number: invoices.number, dueDate: invoices.dueDate })
    .from(invoices)
    .where(and(sql`${invoices.status} IN ('sent', 'partial')`, sql`${invoices.dueDate} < NOW()`));

  for (const inv of overdueInvoices) {
    await upsertAlert(db, {
      organizationId,
      kind: "invoice_overdue",
      entityId: inv.id,
      message: `Facture ${inv.number} en retard de paiement`,
      severity: "warning",
    });
    created.push(inv.id);
  }

  return created;
}

async function upsertAlert(
  db: Database,
  data: {
    organizationId: string;
    kind: "document_expiry" | "contract_renewal" | "invoice_overdue" | "over_consumption";
    entityId: string;
    message: string;
    severity: "info" | "warning" | "critical";
  }
) {
  // Dedup: delete any existing unresolved alert for same org/kind/entity, then insert
  await db
    .delete(alerts)
    .where(
      and(
        sql`${alerts.organizationId} = ${data.organizationId}`,
        sql`${alerts.kind} = ${data.kind}`,
        sql`${alerts.entityId} = ${data.entityId}`,
        isNull(alerts.resolvedAt)
      )
    );

  await db.insert(alerts).values({
    ...data,
    createdAt: new Date(),
  });
}
