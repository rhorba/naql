import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { db } from "@naql/db";
import { withOrgContext } from "@naql/db";
import { alerts, vehicleDocuments, vehicles } from "@naql/db/schema";
import type { VehicleDocumentRow } from "@naql/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";

const statusLabels = {
  available: "Disponible",
  on_mission: "En mission",
  maintenance: "Maintenance",
  out_of_service: "Hors service",
};

const kindLabels = {
  insurance: "Assurance",
  technical_inspection: "Visite technique",
  license: "Licence",
  other: "Autre",
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [vehicle, docs, docAlerts] = await withOrgContext(db, orgId, async (tenantDb) => {
    const [v] = await tenantDb
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.organizationId, orgId)));
    if (!v) return [null, [], []] as const;

    const d = await tenantDb
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.vehicleId, id))
      .orderBy(vehicleDocuments.expiresAt);

    const a = await tenantDb
      .select()
      .from(alerts)
      .where(and(eq(alerts.kind, "document_expiry"), isNull(alerts.resolvedAt)));

    return [v, d, a] as const;
  });

  if (!vehicle) notFound();

  const alertEntityIds = new Set(docAlerts.map((a) => a.entityId));
  const now = new Date();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/fleet" className="text-slate-400 hover:text-slate-700 text-sm">
          ← Flotte
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-display font-bold text-slate-900">
          {vehicle.code} — {vehicle.registration}
        </h1>
      </div>

      {/* Vehicle info card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Code" value={vehicle.code} />
          <InfoRow label="Immatriculation" value={vehicle.registration} />
          <InfoRow label="Marque" value={vehicle.make ?? "—"} />
          <InfoRow label="Modèle" value={vehicle.model ?? "—"} />
          <InfoRow label="Année" value={vehicle.year?.toString() ?? "—"} />
          <InfoRow label="Statut" value={statusLabels[vehicle.status]} />
          <InfoRow label="Capacité" value={vehicle.capacityKg ? `${vehicle.capacityKg} kg` : "—"} />
          <InfoRow
            label="Conso. de base"
            value={vehicle.baselineConsumption ? `${vehicle.baselineConsumption} L/100km` : "—"}
          />
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Documents</h2>
          <Link
            href={`/fleet/${id}/documents/new`}
            className="text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            + Ajouter un document
          </Link>
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun document enregistré.</p>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Référence
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Expiration
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    État
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(docs as VehicleDocumentRow[]).map((doc) => {
                  const hasAlert = alertEntityIds.has(doc.id);
                  const expired = doc.expiresAt < now;
                  const daysLeft = Math.ceil(
                    (doc.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {kindLabels[doc.kind]}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{doc.reference ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 tabular">
                        {doc.expiresAt.toLocaleDateString("fr-MA")}
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="text-red-600 text-xs font-medium">✗ Expiré</span>
                        ) : hasAlert ? (
                          <span className="text-amber-600 text-xs font-medium">⚠ {daysLeft}j</span>
                        ) : (
                          <span className="text-emerald-600 text-xs">✓ Valide</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}
