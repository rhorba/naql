import type { AnomalyResult } from "@naql/core";

const severityConfig = {
  warning: { label: "Avertissement", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  critical: { label: "Critique", className: "bg-red-50 text-red-700 ring-red-200" },
  normal: { label: "Normal", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
} as const;

interface Props {
  anomalies: AnomalyResult[];
  vehicleCodeMap: Map<string, string>;
}

export function ConsumptionRanking({ anomalies, vehicleCodeMap }: Props) {
  if (anomalies.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-card">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <span className="text-base">⛽</span>
        <h2 className="text-sm font-semibold text-slate-900">
          Surconsommation — Anomalies classées par impact
        </h2>
      </div>
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Rang", "Véhicule", "Réel", "Base", "Écart", "Litres extra", "Sévérité"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-start px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {anomalies.map((a, i) => {
              const s = severityConfig[a.severity];
              return (
                <tr key={`${a.vehicleId}-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-medium tabular">#{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {vehicleCodeMap.get(a.vehicleId) ?? a.vehicleId}
                  </td>
                  <td className="px-4 py-3 tabular text-red-600 font-medium">
                    {a.actualLPer100km.toFixed(1)} L/100
                  </td>
                  <td className="px-4 py-3 tabular text-slate-600">
                    {a.baselineLPer100km.toFixed(1)} L/100
                  </td>
                  <td className="px-4 py-3 tabular font-semibold text-red-600">
                    +{a.deviationPct.toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 tabular text-slate-700">
                    +{a.extraLitres.toFixed(1)} L
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.className}`}
                    >
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
