import { auth } from "@/auth";
import { VehicleTable } from "@/components/fleet/vehicle-table";
import { Link } from "@/i18n/navigation";
import { db } from "@naql/db";
import { withOrgContext } from "@naql/db";
import { alerts, vehicles } from "@naql/db/schema";
import type { VehicleRow } from "@naql/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function FleetPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [vehicleList, alertList] = await withOrgContext(db, orgId, async (tenantDb) => {
    const v = await tenantDb.select().from(vehicles).orderBy(vehicles.code);
    const a = await tenantDb
      .select()
      .from(alerts)
      .where(and(eq(alerts.kind, "document_expiry"), isNull(alerts.resolvedAt)));
    return [v, a] as const;
  });

  const expiryEntityIds = new Set(alertList.map((a) => a.entityId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Flotte</h1>
          <p className="text-slate-500 text-sm mt-1">
            {vehicleList.length} véhicule{vehicleList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/fleet/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Nouveau véhicule
        </Link>
      </div>

      {alertList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <span className="text-base">⚠</span>
          {alertList.length} document{alertList.length !== 1 ? "s" : ""} expire
          {alertList.length !== 1 ? "nt" : ""} bientôt ou sont expirés.
        </div>
      )}

      <VehicleTable vehicles={vehicleList as VehicleRow[]} alertEntityIds={expiryEntityIds} />
    </div>
  );
}
