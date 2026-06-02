import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { clients } from "@naql/db/schema";

export default async function ClientsPage() {
  const session = await auth();
  const orgId = session?.user.organizationId;

  const clientList = await withOrgContext(db, orgId, async (tx) =>
    tx.select().from(clients).orderBy(clients.name)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">
            {clientList.length} client{clientList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Nouveau client
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Nom", "ICE", "Contact", "Solde restant", ""].map((h) => (
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
            {clientList.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.ice ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {c.contactEmail ?? c.contactPhone ?? "—"}
                </td>
                <td className="px-4 py-3 tabular">
                  <span
                    className={
                      c.outstandingBalance > 0 ? "text-red-600 font-semibold" : "text-emerald-600"
                    }
                  >
                    {formatMAD(c.outstandingBalance as Money)}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <Link
                    href={`/clients/${c.id}`}
                    className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Détail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
