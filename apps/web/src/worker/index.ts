import { db, organizations } from "@naql/db";
import { withOrgContext } from "@naql/db";
import { runAlertSweep } from "@naql/notifications";
import PgBoss from "pg-boss";

const DATABASE_URL = process.env.DATABASE_APP_URL ?? process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_APP_URL or DATABASE_URL required for worker");

const boss = new PgBoss({ connectionString: DATABASE_URL });

boss.on("error", (err) => {
  console.error("[worker] pg-boss error", err);
});

async function main() {
  await boss.start();
  console.log("[worker] pg-boss started");

  // alert.sweep — runs for every active org
  await boss.createQueue("alert.sweep");
  boss.work("alert.sweep", async (jobs) => {
    for (const job of jobs) {
      const orgId = (job.data as { organizationId?: string })?.organizationId;
      if (!orgId) continue;
      await withOrgContext(db, orgId, (tenantDb) => runAlertSweep(tenantDb, orgId));
      console.log(`[worker] alert.sweep done for org ${orgId}`);
    }
  });

  // Schedule alert sweep for all orgs every 6 hours
  await boss.schedule("alert.sweep-all", "0 */6 * * *", {});
  await boss.work("alert.sweep-all", async () => {
    const allOrgs = await db.select({ id: organizations.id }).from(organizations);
    for (const org of allOrgs) {
      await boss.send("alert.sweep", { organizationId: org.id });
    }
    console.log(`[worker] Queued alert.sweep for ${allOrgs.length} orgs`);
  });

  // Stub queues for future sprints
  for (const queue of ["invoice.overdue", "payroll.run", "ocr.process"] as const) {
    await boss.createQueue(queue);
    boss.work(queue, async (jobs) => {
      for (const job of jobs) {
        console.log(`[worker] ${queue} job ${job.id} — Sprint 3+ handler`);
      }
    });
  }

  console.log("[worker] All queues registered. Waiting for jobs…");
}

main().catch((err) => {
  console.error("[worker] Fatal startup error", err);
  process.exit(1);
});
