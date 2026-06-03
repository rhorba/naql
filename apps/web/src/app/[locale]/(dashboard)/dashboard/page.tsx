import { auth } from "@/auth";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { db } from "@naql/db";
import { withOrgContext } from "@naql/db";
import { alerts, invoices, missions, vehicles } from "@naql/db/schema";
import type { AlertRow } from "@naql/db/schema";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;
  const name = session.user.name;

  const [vehicleCount, activeMissions, overdueInvoices, activeAlerts] = await withOrgContext(
    db,
    orgId,
    async (tenantDb) => {
      const [vc] = await tenantDb
        .select({ count: count() })
        .from(vehicles)
        .where(and(eq(vehicles.organizationId, orgId), sql`${vehicles.status} = 'available'`));
      const [am] = await tenantDb
        .select({ count: count() })
        .from(missions)
        .where(and(eq(missions.organizationId, orgId), sql`${missions.status} = 'in_progress'`));
      const [oi] = await tenantDb
        .select({ count: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, orgId),
            sql`${invoices.status} IN ('overdue', 'sent', 'partial')`
          )
        );
      const al = await tenantDb
        .select()
        .from(alerts)
        .where(and(eq(alerts.organizationId, orgId), isNull(alerts.resolvedAt)))
        .orderBy(alerts.createdAt);

      return [vc?.count ?? 0, am?.count ?? 0, oi?.count ?? 0, al] as const;
    }
  );

  const kpis = [
    { label: "Véhicules disponibles", value: String(vehicleCount), accent: "text-slate-900" },
    { label: "Missions en cours", value: String(activeMissions), accent: "text-amber-600" },
    { label: "Factures en attente", value: String(overdueInvoices), accent: "text-red-600" },
    {
      label: "Alertes actives",
      value: String(activeAlerts.length),
      accent: activeAlerts.length > 0 ? "text-amber-600" : "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">Bienvenue, {name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-card"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {kpi.label}
            </p>
            <p className={`text-3xl font-bold tabular ${kpi.accent}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <AlertsPanel alerts={activeAlerts as AlertRow[]} />
    </div>
  );
}
