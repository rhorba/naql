import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import type { FuelLogRow } from "@naql/db/schema";

interface FuelTableProps {
  logs: FuelLogRow[];
  vehicleCodeMap: Map<string, string>;
}

const sourceLabel: Record<string, string> = {
  driver_app: "App",
  desktop: "Bureau",
  ocr: "OCR",
};

export function FuelTable({ logs, vehicleCodeMap }: FuelTableProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-card">
        <p className="text-slate-400 text-sm">Aucune entrée de carburant.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Date", "Véhicule", "Litres", "Prix/L", "Total", "Compteur", "Station", "Source"].map(
              (h) => (
                <th
                  key={h}
                  className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 transition">
              <td className="px-4 py-3 text-slate-600 tabular whitespace-nowrap">
                {new Date(log.filledAt).toLocaleDateString("fr-MA")}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {vehicleCodeMap.get(log.vehicleId) ?? "—"}
              </td>
              <td className="px-4 py-3 tabular text-slate-700">{log.litres.toFixed(1)} L</td>
              <td className="px-4 py-3 tabular text-slate-600">
                {(log.pricePerLitre / 100).toFixed(2)} MAD
              </td>
              <td className="px-4 py-3 tabular font-medium text-slate-900">
                {formatMAD(log.total as Money)}
              </td>
              <td className="px-4 py-3 tabular text-slate-500">
                {log.odometer ? `${log.odometer.toLocaleString("fr-MA")} km` : "—"}
              </td>
              <td className="px-4 py-3 text-slate-500 max-w-[100px] truncate">
                {log.station ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-slate-400">
                  {sourceLabel[log.source] ?? log.source}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
