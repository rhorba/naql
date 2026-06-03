import { sql } from "drizzle-orm";
import type { Database } from "./client.js";

/**
 * Set the Postgres GUC `app.current_org` for the duration of a transaction
 * so RLS policies enforce tenant isolation automatically.
 *
 * Usage:
 *   await withOrgContext(db, orgId, async (tx) => {
 *     return tx.select().from(vehicles);
 *   });
 */
export async function withOrgContext<T>(
  db: Database,
  organizationId: string,
  fn: (db: Database) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org', ${organizationId}, true)`);
    return fn(tx as unknown as Database);
  });
}
