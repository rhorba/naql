import { auth } from "@/auth";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { invoices, payments } from "@naql/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

const methodLabel: Record<string, string> = {
  cash: "Espèces",
  bank: "Virement",
  cheque: "Chèque",
  other: "Autre",
};

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [paymentList, invoiceList] = await withOrgContext(db, orgId, async (tx) => {
    const p = await tx
      .select()
      .from(payments)
      .where(eq(payments.organizationId, orgId))
      .orderBy(desc(payments.paidAt));
    const i = await tx
      .select({ id: invoices.id, number: invoices.number })
      .from(invoices)
      .where(eq(invoices.organizationId, orgId));
    return [p, i] as const;
  });

  const invoiceMap = new Map(invoiceList.map((i) => [i.id, i.number]));
  const total = paymentList.reduce((s, p) => s + p.amount, 0) as Money;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Paiements reçus</h1>
        <p className="text-slate-500 text-sm mt-1">
          Total encaissé:{" "}
          <span className="font-semibold text-emerald-600 tabular">{formatMAD(total)}</span>
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Date", "Facture", "Montant", "Mode"].map((h) => (
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
            {paymentList.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 tabular">
                  {new Date(p.paidAt).toLocaleDateString("fr-MA")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {p.invoiceId ? (invoiceMap.get(p.invoiceId) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 tabular font-semibold text-emerald-600">
                  {formatMAD(p.amount as Money)}
                </td>
                <td className="px-4 py-3 text-slate-500">{methodLabel[p.method] ?? p.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
