import type { Database } from "@naql/db";
import { invoiceNumberSequences } from "@naql/db/schema";
import { sql } from "drizzle-orm";
import { formatInvoiceNumber } from "./invoice-number";

/**
 * Allocate the next invoice number for an org in a given year.
 * Uses Postgres advisory lock (pg_advisory_xact_lock) to prevent races
 * under concurrent invoice creation. Must be called inside a transaction.
 *
 * Returns: "INV-2026-0001"
 */
export async function allocateInvoiceNumber(
  db: Database,
  organizationId: string,
  year: number
): Promise<string> {
  return db.transaction(async (tx) => {
    // Advisory lock: hash(orgId + year) — scoped to this transaction
    const lockKey = hashLockKey(organizationId, year);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

    // Upsert the sequence row
    await tx
      .insert(invoiceNumberSequences)
      .values({ organizationId, year: String(year), lastSequence: "0" })
      .onConflictDoNothing();

    // Atomically increment
    const [row] = await tx.execute<{ last_sequence: string }>(
      sql`
        UPDATE invoice_number_sequences
        SET last_sequence = (last_sequence::int + 1)::text
        WHERE organization_id = ${organizationId} AND year = ${String(year)}
        RETURNING last_sequence
      `
    );

    const sequence = Number(row?.last_sequence ?? 1);
    return formatInvoiceNumber(year, sequence);
  });
}

function hashLockKey(orgId: string, year: number): number {
  let hash = year;
  for (let i = 0; i < orgId.length; i++) {
    hash = (Math.imul(31, hash) + orgId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
