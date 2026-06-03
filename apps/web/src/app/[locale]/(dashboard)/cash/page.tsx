import { auth } from "@/auth";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { expenses, payments } from "@naql/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function CashPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [cashIn, cashOut] = await withOrgContext(db, orgId, async (tx) => {
    const inc = await tx
      .select({ amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .where(and(eq(payments.organizationId, orgId), sql`${payments.method} IN ('cash','cheque')`))
      .orderBy(desc(payments.paidAt));

    const out = await tx
      .select({
        amount: expenses.amount,
        spentAt: expenses.spentAt,
        description: expenses.description,
      })
      .from(expenses)
      .where(eq(expenses.organizationId, orgId))
      .orderBy(desc(expenses.spentAt))
      .limit(100);

    return [inc, out] as const;
  });

  const totalIn = cashIn.reduce((s, r) => s + r.amount, 0) as Money;
  const totalOut = cashOut.reduce((s, r) => s + r.amount, 0) as Money;
  const balance = (totalIn - totalOut) as Money;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-slate-900">Caisse & Banque</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Entrées", value: totalIn, accent: "text-emerald-600" },
          { label: "Sorties", value: totalOut, accent: "text-red-600" },
          {
            label: "Solde",
            value: balance,
            accent: balance >= 0 ? "text-emerald-600" : "text-red-600",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-lg border border-slate-200 shadow-card p-5"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {k.label}
            </p>
            <p className={`text-2xl font-bold tabular ${k.accent}`}>{formatMAD(k.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-card">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Encaissements (espèces / chèques)
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {cashIn.slice(0, 15).map((r) => (
              <div
                key={`${r.paidAt.toISOString()}-${r.amount}`}
                className="px-4 py-3 flex justify-between text-sm"
              >
                <span className="text-slate-500 tabular">
                  {new Date(r.paidAt).toLocaleDateString("fr-MA")}
                </span>
                <span className="tabular font-medium text-emerald-600">
                  {formatMAD(r.amount as Money)}
                </span>
              </div>
            ))}
            {cashIn.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400">Aucun encaissement.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-card">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Décaissements / Dépenses</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {cashOut.slice(0, 15).map((r) => (
              <div
                key={`${r.spentAt.toISOString()}-${r.amount}`}
                className="px-4 py-3 flex justify-between text-sm"
              >
                <span className="text-slate-600">{r.description ?? "Dépense"}</span>
                <span className="tabular font-medium text-red-600">
                  {formatMAD(r.amount as Money)}
                </span>
              </div>
            ))}
            {cashOut.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400">Aucune dépense.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
