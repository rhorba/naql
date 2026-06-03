import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { clients, invoices } from "@naql/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

const statusConfig = {
  draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  sent: { label: "Envoyée", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  partial: { label: "Partiel", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  paid: { label: "Payée", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  overdue: { label: "En retard", className: "bg-red-50 text-red-700 ring-red-200" },
  cancelled: { label: "Annulée", className: "bg-slate-100 text-slate-500 ring-slate-200" },
} as const;

export default async function InvoicingPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [invoiceList, clientList] = await withOrgContext(db, orgId, async (tx) => {
    const i = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.organizationId, orgId))
      .orderBy(desc(invoices.issueDate));
    const c = await tx.select({ id: clients.id, name: clients.name }).from(clients);
    return [i, c] as const;
  });

  const clientMap = new Map(clientList.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Facturation</h1>
          <p className="text-slate-500 text-sm mt-1">
            {invoiceList.length} facture{invoiceList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/invoicing/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Nouvelle facture
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["N°", "Client", "Date", "Échéance", "Montant TTC", "Statut", ""].map((h) => (
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
            {invoiceList.map((inv) => {
              const s = statusConfig[inv.status];
              return (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                    {inv.number}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{clientMap.get(inv.clientId) ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 tabular whitespace-nowrap">
                    {new Date(inv.issueDate).toLocaleDateString("fr-MA")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 tabular whitespace-nowrap">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("fr-MA") : "—"}
                  </td>
                  <td className="px-4 py-3 tabular font-semibold text-slate-900">
                    {formatMAD(inv.total as Money)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.className}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/invoicing/${inv.id}`}
                      className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                    >
                      Voir →
                    </Link>
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
