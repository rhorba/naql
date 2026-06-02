"use client";

import { runPayroll } from "@/app/actions/payroll";
import type { PayrollRunResult } from "@/app/actions/payroll";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { useState } from "react";

export default function PayrollPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workingDays, setWorkingDays] = useState(22);
  const [result, setResult] = useState<PayrollRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runPayroll({ year, month, workingDays });
      setResult(res as PayrollRunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du calcul");
    } finally {
      setLoading(false);
    }
  }

  const monthNames = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Paie</h1>
        <p className="text-slate-500 text-sm mt-1">Calcul de la paie mensuelle (CNSS + IR + AMO)</p>
      </div>

      {/* Parameters */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Paramètres de la période</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-1">
              Année
            </label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-slate-700 mb-1">
              Mois
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
            >
              {monthNames.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="workingDays" className="block text-sm font-medium text-slate-700 mb-1">
              Jours ouvrés
            </label>
            <input
              id="workingDays"
              type="number"
              min={18}
              max={23}
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={handleRun}
            className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 disabled:opacity-60 transition"
          >
            {loading ? "Calcul en cours…" : "Calculer la paie"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                Total net versé
              </p>
              <p className="text-2xl font-bold tabular text-emerald-600">
                {formatMAD(result.totalNetPaid as Money)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                Coût employeur total
              </p>
              <p className="text-2xl font-bold tabular text-red-600">
                {formatMAD(result.totalEmployerCost as Money)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                Bulletins de paie — {result.month}
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Employé", "Brut", "Abs.", "CNSS", "AMO", "IR", "Avances", "Net"].map((h) => (
                    <th
                      key={h}
                      className="text-start px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.payslips.map((p) => (
                  <tr key={p.employeeId} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{p.employeeName}</td>
                    <td className="px-3 py-3 tabular text-slate-700">
                      {formatMAD(p.grossBeforeDeductions as Money)}
                    </td>
                    <td className="px-3 py-3 tabular text-red-500">
                      {p.absenceDeduction > 0 ? `-${formatMAD(p.absenceDeduction as Money)}` : "—"}
                    </td>
                    <td className="px-3 py-3 tabular text-slate-600">
                      {formatMAD(p.cnssEmployee as Money)}
                    </td>
                    <td className="px-3 py-3 tabular text-slate-600">
                      {formatMAD(p.amoEmployee as Money)}
                    </td>
                    <td className="px-3 py-3 tabular text-slate-600">
                      {formatMAD(p.irWithheld as Money)}
                    </td>
                    <td className="px-3 py-3 tabular text-amber-600">
                      {p.advancesDeducted > 0 ? formatMAD(p.advancesDeducted as Money) : "—"}
                    </td>
                    <td className="px-3 py-3 tabular font-bold text-emerald-600">
                      {formatMAD(p.net as Money)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
