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
  organizationId: string | undefined,
  fn: (db: Database) => Promise<T>
): Promise<T> {
  if (!organizationId) throw new Error("withOrgContext: organizationId is required");
  return db.transaction(async (tx) => {
    // Switch to the app role so RLS policies are enforced.
    // Superuser connections (migrations, tests) downgrade to naql_app within
    // the transaction; production connections are already naql_app (no-op).
    await tx.execute(sql`SET LOCAL ROLE naql_app`);
    await tx.execute(sql`SELECT set_config('app.current_org', ${organizationId}, true)`);
    return fn(tx as unknown as Database);
  });
}
