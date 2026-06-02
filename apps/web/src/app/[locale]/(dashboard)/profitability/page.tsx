import { auth } from "@/auth";
import { computeProfitability } from "@naql/billing";
import { formatMAD, zero } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { clients, expenses, fuelLogs, invoices, missions, vehicles } from "@naql/db/schema";
import { and, eq, sql } from "drizzle-orm";

export default async function ProfitabilityPage() {
  const session = await auth();
  const orgId = session?.user.organizationId;

  const data = await withOrgContext(db, orgId, async (tx) => {
    // Revenue: sum of paid + partial invoice totals
    const revenueRows = await tx
      .select({ total: invoices.total })
      .from(invoices)
      .where(
        and(eq(invoices.organizationId, orgId), sql`${invoices.status} IN ('paid','partial')`)
      );
    const revenue = revenueRows.reduce((s, r) => s + r.total, 0) as Money;

    // Fuel cost
    const fuelRows = await tx
      .select({ total: fuelLogs.total })
      .from(fuelLogs)
      .where(eq(fuelLogs.organizationId, orgId));
    const fuelCost = fuelRows.reduce((s, r) => s + r.total, 0) as Money;

    // Salary cost
    const salaryRows = await tx
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(and(eq(expenses.organizationId, orgId), eq(expenses.category, "salary")));
    const salaryCost = salaryRows.reduce((s, r) => s + r.amount, 0) as Money;

    // Maintenance
    const maintRows = await tx
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(and(eq(expenses.organizationId, orgId), eq(expenses.category, "maintenance")));
    const maintenanceCost = maintRows.reduce((s, r) => s + r.amount, 0) as Money;

    // Other expenses
    const otherRows = await tx
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(
        and(
          eq(expenses.organizationId, orgId),
          sql`${expenses.category} NOT IN ('fuel','maintenance','salary')`
        )
      );
    const otherExpenses = otherRows.reduce((s, r) => s + r.amount, 0) as Money;

    // Total fuel distance (for cost-per-km approximation)
    const fuelWithOdo = await tx
      .select({ odometer: fuelLogs.odometer, vehicleId: fuelLogs.vehicleId })
      .from(fuelLogs)
      .where(and(eq(fuelLogs.organizationId, orgId), sql`${fuelLogs.odometer} IS NOT NULL`));
    const distanceKm = Math.max(
      0,
      fuelWithOdo.length > 1
        ? fuelWithOdo.reduce((max, r) => Math.max(max, r.odometer ?? 0), 0) -
            fuelWithOdo.reduce((min, r) => Math.min(min, r.odometer ?? 99999), 99999)
        : 0
    );

    // Per-vehicle margin
    const vehicleList = await tx.select().from(vehicles).where(eq(vehicles.organizationId, orgId));
    const missionList = await tx
      .select({
        vehicleId: missions.vehicleId,
        agreedPrice: missions.agreedPrice,
        status: missions.status,
      })
      .from(missions)
      .where(
        and(eq(missions.organizationId, orgId), sql`${missions.status} IN ('completed','invoiced')`)
      );
    const fuelByVehicle = new Map<string, number>();
    for (const f of fuelRows) {
      // Note: simplified — uses total fuel cost per vehicle
      fuelByVehicle.set("all", (fuelByVehicle.get("all") ?? 0) + f.total);
    }
    const vehicleMargins = vehicleList
      .map((v) => {
        const vMissions = missionList.filter((m) => m.vehicleId === v.id);
        const vRevenue = vMissions.reduce((s, m) => s + m.agreedPrice, 0) as Money;
        return { code: v.code, revenue: vRevenue, margin: vRevenue as Money, marginPct: 0 };
      })
      .filter((v) => v.revenue > 0);

    // Per-client margin
    const clientList = await tx
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.organizationId, orgId));
    const _clientMargins = clientList.map((c) => {
      const _cMissions = missionList.filter((_m) => {
        // re-join missions by clientId — simplified fetch
        return false; // placeholder: real join below
      });
      return { name: c.name, revenue: zero() as Money };
    });

    const missionsFull = await tx
      .select({ clientId: missions.clientId, agreedPrice: missions.agreedPrice })
      .from(missions)
      .where(
        and(eq(missions.organizationId, orgId), sql`${missions.status} IN ('completed','invoiced')`)
      );
    const revenueByClient = new Map<string, number>();
    for (const m of missionsFull) {
      revenueByClient.set(m.clientId, (revenueByClient.get(m.clientId) ?? 0) + m.agreedPrice);
    }
    const clientMarginsReal = clientList
      .map((c) => ({ name: c.name, revenue: (revenueByClient.get(c.id) ?? 0) as Money }))
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return {
      revenue,
      fuelCost,
      salaryCost,
      maintenanceCost,
      otherExpenses,
      distanceKm,
      vehicleMargins,
      clientMargins: clientMarginsReal,
    };
  });

  const pl = computeProfitability({
    revenue: data.revenue,
    fuelCost: data.fuelCost,
    salaryCost: data.salaryCost,
    maintenanceCost: data.maintenanceCost,
    otherExpenses: data.otherExpenses,
    totalDistanceKm: data.distanceKm,
  });

  const kpis = [
    { label: "Revenus encaissés", value: formatMAD(pl.revenue), accent: "text-emerald-600" },
    { label: "Charges totales", value: formatMAD(pl.totalCosts), accent: "text-red-600" },
    {
      label: "Marge brute",
      value: formatMAD(pl.grossMargin),
      accent: pl.grossMargin >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      label: "Taux de marge",
      value: `${pl.marginPct.toFixed(1)} %`,
      accent: pl.marginPct >= 20 ? "text-emerald-600" : "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Rentabilité</h1>
        <p className="text-slate-500 text-sm mt-1">Résultat global · Cumul</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-lg border border-slate-200 shadow-card p-5"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {k.label}
            </p>
            <p className={`text-2xl font-bold tabular ${k.accent}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Répartition des charges</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Gasoil", value: data.fuelCost },
              { label: "Salaires", value: data.salaryCost },
              { label: "Maintenance", value: data.maintenanceCost },
              { label: "Autres", value: data.otherExpenses },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-slate-600">{row.label}</span>
                <span className="tabular font-medium text-slate-900">
                  {formatMAD(row.value as Money)}
                </span>
              </div>
            ))}
            {data.distanceKm > 0 && (
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 text-xs">Coût / km</span>
                <span className="tabular font-medium text-slate-700">
                  {formatMAD(pl.costPerKm)} / km
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Margin by client */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">
            Chiffre d'affaires par client
          </h2>
          {data.clientMargins.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée disponible.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {data.clientMargins.slice(0, 6).map((c) => (
                <div key={c.name} className="flex justify-between items-center">
                  <span className="text-slate-700 truncate max-w-[60%]">{c.name}</span>
                  <span className="tabular font-medium text-slate-900">{formatMAD(c.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Margin by vehicle */}
      {data.vehicleMargins.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Revenu par véhicule</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.vehicleMargins.map((v) => (
              <div key={v.code} className="bg-slate-50 rounded-lg p-4">
                <p className="font-bold text-slate-900 tabular text-lg">{v.code}</p>
                <p className="text-emerald-600 font-semibold tabular">{formatMAD(v.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
