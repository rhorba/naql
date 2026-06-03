import { auth } from "@/auth";
import { InvoiceActions } from "@/components/invoicing/invoice-actions";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@naql/core";
import type { Money } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import { clients, invoices, organizations } from "@naql/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

const statusConfig = {
  draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  sent: { label: "Envoyée", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  partial: { label: "Partiel", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  paid: { label: "Payée", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  overdue: { label: "En retard", className: "bg-red-50 text-red-700 ring-red-200" },
  cancelled: { label: "Annulée", className: "bg-slate-100 text-slate-500 ring-slate-200" },
} as const;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id, locale } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [invoice, client, org] = await withOrgContext(db, orgId, async (tx) => {
    const [inv] = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, orgId)));
    if (!inv) return [null, null, null] as const;
    const [c] = await tx.select().from(clients).where(eq(clients.id, inv.clientId));
    const [o] = await tx.select().from(organizations).where(eq(organizations.id, orgId));
    return [inv, c, o] as const;
  });

  if (!invoice || !client || !org) notFound();

  const lines = invoice.lines as {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  const s = statusConfig[invoice.status];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoicing" className="text-slate-400 hover:text-slate-700 text-sm">
          ← Facturation
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-mono text-sm font-semibold text-slate-900">{invoice.number}</span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.className}`}
        >
          {s.label}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6 space-y-6">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
              Émetteur
            </p>
            <p className="font-semibold text-slate-900">{org.name}</p>
            {org.ice && <p className="text-slate-500 text-xs mt-1">ICE: {org.ice}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
              Client
            </p>
            <p className="font-semibold text-slate-900">{client.name}</p>
            {client.ice && <p className="text-slate-500 text-xs mt-1">ICE: {client.ice}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
              Date d'émission
            </p>
            <p className="tabular">{new Date(invoice.issueDate).toLocaleDateString("fr-MA")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
              Date d'échéance
            </p>
            <p className="tabular">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("fr-MA") : "—"}
            </p>
          </div>
        </div>

        {/* Lines */}
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-900 text-white">
              {["Désignation", "Qté", "Prix HT", "Montant HT"].map((h) => (
                <th key={h} className="text-start px-4 py-2.5 text-xs font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l) => (
              <tr key={`${l.description}-${l.unitPrice}`} className="hover:bg-slate-50">
                <td className="px-4 py-3">{l.description}</td>
                <td className="px-4 py-3 tabular text-center">{l.quantity}</td>
                <td className="px-4 py-3 tabular text-end">{formatMAD(l.unitPrice as Money)}</td>
                <td className="px-4 py-3 tabular text-end font-medium">
                  {formatMAD(l.amount as Money)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total HT</span>
              <span className="tabular">{formatMAD(invoice.subtotal as Money)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>TVA ({Math.round(invoice.vatRate * 100)}%)</span>
              <span className="tabular">{formatMAD(invoice.vatAmount as Money)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 bg-amber-50 rounded-lg px-3 py-2">
              <span>Total TTC</span>
              <span className="tabular">{formatMAD(invoice.total as Money)}</span>
            </div>
          </div>
        </div>
      </div>

      <InvoiceActions invoiceId={id} status={invoice.status} locale={locale as "fr" | "ar"} />
    </div>
  );
}
