import type { AlertRow } from "@naql/db/schema";

const severityConfig = {
  critical: { icon: "✗", className: "bg-red-50 border-red-200 text-red-800" },
  warning: { icon: "⚠", className: "bg-amber-50 border-amber-200 text-amber-800" },
  info: { icon: "ℹ", className: "bg-slate-50 border-slate-200 text-slate-700" },
} as const;

interface AlertsPanelProps {
  alerts: AlertRow[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-card">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">
          Alertes actives
          <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-amber-500 text-white rounded-full">
            {alerts.length}
          </span>
        </h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {alerts.slice(0, 10).map((alert) => {
          const s = severityConfig[alert.severity];
          return (
            <li key={alert.id} className="px-4 py-3 flex items-start gap-3">
              <span
                className={`mt-0.5 text-sm ${s.className.includes("red") ? "text-red-600" : s.className.includes("amber") ? "text-amber-600" : "text-slate-500"}`}
              >
                {s.icon}
              </span>
              <p className="text-sm text-slate-700 leading-tight">{alert.message}</p>
            </li>
          );
        })}
      </ul>
      {alerts.length > 10 && (
        <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
          +{alerts.length - 10} alerte{alerts.length - 10 !== 1 ? "s" : ""} supplémentaire
          {alerts.length - 10 !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
