import { auth } from "@/auth";
import { OcrReceiptForm } from "@/components/fuel/ocr-receipt-form";
import { db, withOrgContext } from "@naql/db";
import { vehicles } from "@naql/db/schema";
import { notFound } from "next/navigation";

export default async function OcrReceiptPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const vehicleList = await withOrgContext(db, orgId, async (tx) =>
    tx.select({ id: vehicles.id, code: vehicles.code, make: vehicles.make }).from(vehicles)
  );

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Capture de reçu — OCR</h1>
        <p className="text-slate-500 text-sm mt-1">
          Photographiez un reçu de carburant pour pré-remplir automatiquement le formulaire.
        </p>
      </div>
      <OcrReceiptForm vehicles={vehicleList} />
    </div>
  );
}
