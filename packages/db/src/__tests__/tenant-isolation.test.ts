import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
/**
 * Cross-tenant isolation test (S0-17)
 *
 * Verifies:
 * 1. Org A's data is invisible to org B when app.current_org is set to org B
 * 2. A crafted organizationId in a payload cannot bypass RLS
 * 3. withOrgContext correctly scopes queries
 *
 * Requires a real Postgres instance (DATABASE_URL env var).
 * Skipped automatically in environments without DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../client";
import { organizations, users, vehicles } from "../schema/index";
import { withOrgContext } from "../tenant";

const DATABASE_URL = process.env.DATABASE_URL;

const describeIf = (cond: boolean) => (cond ? describe : describe.skip);

describeIf(!!DATABASE_URL)("Cross-tenant isolation", () => {
  let sql: ReturnType<typeof postgres>;
  let db: Database;
  let orgAId: string;
  let orgBId: string;

  beforeAll(async () => {
    // DATABASE_URL is guaranteed non-null here by describeIf(!!DATABASE_URL)
    sql = postgres(DATABASE_URL as string, { max: 3 });
    db = drizzle(sql, { schema: { organizations, users, vehicles } }) as unknown as Database;

    // Create two orgs
    const [orgA] = await db
      .insert(organizations)
      .values({ name: "Org A — Isolation Test", plan: "trial", locale: "fr", currency: "MAD" })
      .returning({ id: organizations.id });
    const [orgB] = await db
      .insert(organizations)
      .values({ name: "Org B — Isolation Test", plan: "trial", locale: "fr", currency: "MAD" })
      .returning({ id: organizations.id });

    orgAId = orgA?.id ?? "";
    orgBId = orgB?.id ?? "";

    // Insert a vehicle for Org A
    await db.insert(vehicles).values({
      organizationId: orgAId,
      code: "ISOLATION-A-01",
      registration: "A-0001",
      status: "available",
    });
  });

  afterAll(async () => {
    // Clean up test orgs (cascades to vehicles via FK)
    await db.delete(organizations).where(eq(organizations.id, orgAId));
    await db.delete(organizations).where(eq(organizations.id, orgBId));
    await sql.end();
  });

  it("Org B context cannot see Org A vehicles", async () => {
    const result = await withOrgContext(db, orgBId, async (tenantDb) => {
      return tenantDb.select().from(vehicles).where(eq(vehicles.code, "ISOLATION-A-01"));
    });

    expect(result).toHaveLength(0);
  });

  it("Org A context can see its own vehicles", async () => {
    const result = await withOrgContext(db, orgAId, async (tenantDb) => {
      return tenantDb.select().from(vehicles).where(eq(vehicles.code, "ISOLATION-A-01"));
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.organizationId).toBe(orgAId);
  });

  it("Crafted organizationId in filter cannot cross tenants", async () => {
    // Simulate: attacker is in org B, tries to filter by org A's id directly
    const result = await withOrgContext(db, orgBId, async (tenantDb) => {
      return tenantDb.select().from(vehicles).where(eq(vehicles.organizationId, orgAId)); // crafted org A id
    });

    // RLS should filter this to 0 rows even though the WHERE asks for org A
    expect(result).toHaveLength(0);
  });
});
