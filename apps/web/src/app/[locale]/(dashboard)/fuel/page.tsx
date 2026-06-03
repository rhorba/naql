import { auth } from "@/auth";
import { ConsumptionRanking } from "@/components/fuel/consumption-ranking";
import { FuelTable } from "@/components/fuel/fuel-table";
import { Link } from "@/i18n/navigation";
import { computeConsumption, detectAnomaly, rankAnomalies } from "@naql/core";
import type { AnomalyResult } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { fuelLogs, vehicles } from "@naql/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function FuelPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [fuelList, vehicleList] = await withOrgContext(db, orgId, async (tx) => {
    const f = await tx
      .select()
      .from(fuelLogs)
      .where(eq(fuelLogs.organizationId, orgId))
      .orderBy(desc(fuelLogs.filledAt))
      .limit(100);

    const v = await tx
      .select({
        id: vehicles.id,
        code: vehicles.code,
        baselineConsumption: vehicles.baselineConsumption,
      })
      .from(vehicles)
      .where(eq(vehicles.organizationId, orgId));

    return [f, v] as const;
  });

  // Compute anomalies server-side for ranking
  const baselineMap = new Map(vehicleList.map((v) => [v.id, v.baselineConsumption ?? 0]));
  const byVehicle = new Map<string, typeof fuelList>();
  for (const log of [...fuelList].reverse()) {
    const arr = byVehicle.get(log.vehicleId) ?? [];
    arr.push(log);
    byVehicle.set(log.vehicleId, arr);
  }

  const anomalies: AnomalyResult[] = [];
  for (const [vehicleId, logs] of byVehicle) {
    const baseline = baselineMap.get(vehicleId) ?? 0;
    if (baseline <= 0 || logs.length < 2) continue;
    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1];
      const curr = logs[i];
      if (!prev?.odometer || !curr?.odometer) continue;
      const result = computeConsumption({
        vehicleId,
        litres: curr.litres,
        odometerStart: prev.odometer,
        odometerEnd: curr.odometer,
        source: "odometer",
      });
      const anomaly = detectAnomaly(result, baseline);
      if (anomaly.severity !== "normal" || anomaly.needsReview) {
        anomalies.push(anomaly);
      }
    }
  }

  const vehicleCodeMap = new Map(vehicleList.map((v) => [v.id, v.code]));
  const ranked = rankAnomalies(anomalies);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Gasoil & Consommation</h1>
          <p className="text-slate-500 text-sm mt-1">{fuelList.length} entrées</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fuel/ocr"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-50 transition"
          >
            📷 OCR Reçu
          </Link>
          <Link
            href="/fuel/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
          >
            + Plein de carburant
          </Link>
        </div>
      </div>

      {ranked.length > 0 && (
        <ConsumptionRanking anomalies={ranked} vehicleCodeMap={vehicleCodeMap} />
      )}

      <FuelTable logs={fuelList} vehicleCodeMap={vehicleCodeMap} />
    </div>
  );
}
