import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { expenses } from "@naql/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

const categoryLabel: Record<string, string> = {
  fuel: "Gasoil",
  maintenance: "Maintenance",
  tolls: "Péages",
  salary: "Salaire",
  admin: "Administratif",
  other: "Autre",
};

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const list = await withOrgContext(db, orgId, async (tx) =>
    tx
      .select()
      .from(expenses)
      .where(eq(expenses.organizationId, orgId))
      .orderBy(desc(expenses.spentAt))
      .limit(200)
  );

  const total = list.reduce((s, e) => s + e.amount, 0) as Money;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Dépenses</h1>
          <p className="text-slate-500 text-sm mt-1">
            Total: <span className="font-semibold text-red-600 tabular">{formatMAD(total)}</span>
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Nouvelle dépense
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Date", "Catégorie", "Description", "Montant", "Reçu"].map((h) => (
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
            {list.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 tabular">
                  {new Date(e.spentAt).toLocaleDateString("fr-MA")}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {categoryLabel[e.category] ?? e.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.description ?? "—"}</td>
                <td className="px-4 py-3 tabular font-semibold text-red-600">
                  {formatMAD(e.amount as Money)}
                </td>
                <td className="px-4 py-3">
                  {e.receiptUrl ? (
                    <a
                      href={e.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-600 hover:text-amber-800"
                    >
                      Voir
                    </a>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
