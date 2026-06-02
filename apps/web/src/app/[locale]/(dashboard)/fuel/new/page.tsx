import { auth } from "@/auth";
import { FuelLogForm } from "@/components/fuel/fuel-log-form";
import { db, withOrgContext } from "@naql/db";
import { vehicles } from "@naql/db/schema";

export default async function NewFuelLogPage() {
  const session = await auth();
  const orgId = session?.user.organizationId;

  const vehicleList = await withOrgContext(db, orgId, async (tx) => {
    return tx.select({ id: vehicles.id, code: vehicles.code, make: vehicles.make }).from(vehicles);
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Nouveau plein</h1>
        <p className="text-slate-500 text-sm mt-1">Enregistrer une entrée de carburant</p>
      </div>
      <FuelLogForm vehicles={vehicleList} />
    </div>
  );
}
