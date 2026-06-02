"use client";

import { transitionMission } from "@/app/actions/missions";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { useState } from "react";

const STATUS_CONFIG = {
  planned: { label: "Planifiée", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  in_progress: { label: "En cours", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  completed: { label: "Terminée", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  invoiced: { label: "Facturée", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  cancelled: { label: "Annulée", className: "bg-red-50 text-red-700 ring-red-200" },
} as const;

const NEXT_STATUS: Record<string, string> = {
  planned: "in_progress",
  in_progress: "completed",
  completed: "invoiced",
};

const NEXT_LABEL: Record<string, string> = {
  planned: "Démarrer",
  in_progress: "Terminer",
  completed: "Facturer",
};

interface Mission {
  id: string;
  status: string;
  originCity: string;
  destinationCity: string;
  cargo: string | null;
  agreedPrice: number;
  startDate: Date;
  endDate: Date | null;
  clientId: string;
  vehicleId: string | null;
  driverId: string | null;
}

interface MissionBoardProps {
  missions: Mission[];
  vehicles: { id: string; code: string; status: string }[];
  clients: { id: string; name: string }[];
}

export function MissionBoard({ missions, vehicles, clients }: MissionBoardProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.code]));

  async function advance(id: string, status: string) {
    setBusy(id);
    try {
      await transitionMission({
        id,
        status: status as "in_progress" | "completed" | "invoiced" | "cancelled",
      });
    } finally {
      setBusy(null);
    }
  }

  if (missions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-card">
        <p className="text-slate-400 text-sm">Aucune mission enregistrée.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Client", "Trajet", "Cargo", "Prix", "Départ", "Véhicule", "Statut", ""].map((h) => (
              <th
                key={h}
                className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {missions.map((m) => {
            const s = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG];
            const next = NEXT_STATUS[m.status];
            return (
              <tr key={m.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {clientMap.get(m.clientId) ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {m.originCity} → {m.destinationCity}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">
                  {m.cargo ?? "—"}
                </td>
                <td className="px-4 py-3 tabular font-medium text-slate-900">
                  {formatMAD(m.agreedPrice as Money)}
                </td>
                <td className="px-4 py-3 text-slate-500 tabular whitespace-nowrap">
                  {new Date(m.startDate).toLocaleDateString("fr-MA")}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {m.vehicleId ? (vehicleMap.get(m.vehicleId) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s?.className ?? ""}`}
                  >
                    {s?.label ?? m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  {next && (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => advance(m.id, next)}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-800 disabled:opacity-50 transition"
                    >
                      {busy === m.id ? "…" : NEXT_LABEL[m.status]}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
