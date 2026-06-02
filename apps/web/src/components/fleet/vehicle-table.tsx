"use client";

import { Link } from "@/i18n/navigation";
import type { VehicleRow } from "@naql/db/schema";

const statusConfig = {
  available: { label: "Disponible", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  on_mission: { label: "En mission", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  maintenance: { label: "Maintenance", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  out_of_service: { label: "Hors service", className: "bg-red-50 text-red-700 ring-red-200" },
} as const;

interface VehicleTableProps {
  vehicles: VehicleRow[];
  alertEntityIds: Set<string>;
}

export function VehicleTable({ vehicles, alertEntityIds }: VehicleTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-card">
        <p className="text-slate-400 text-sm">Aucun véhicule enregistré.</p>
        <Link
          href="/fleet/new"
          className="mt-3 inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
        >
          Ajouter le premier véhicule →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Code
            </th>
            <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Immatriculation
            </th>
            <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Marque / Modèle
            </th>
            <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Statut
            </th>
            <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Documents
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vehicles.map((v) => {
            const s = statusConfig[v.status];
            const hasDocAlert = alertEntityIds.has(v.id);
            return (
              <tr key={v.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-semibold text-slate-900 tabular">{v.code}</td>
                <td className="px-4 py-3 text-slate-700">{v.registration}</td>
                <td className="px-4 py-3 text-slate-600">
                  {[v.make, v.model].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.className}`}
                  >
                    {s.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {hasDocAlert ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                      <span>⚠</span> Alerte
                    </span>
                  ) : (
                    <span className="text-emerald-600 text-xs">✓ OK</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <Link
                    href={`/fleet/${v.id}`}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Détail →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
