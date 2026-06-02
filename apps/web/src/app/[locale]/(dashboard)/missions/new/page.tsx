import { auth } from "@/auth";
import { MissionForm } from "@/components/missions/mission-form";
import { db, withOrgContext } from "@naql/db";
import { clients, users, vehicles } from "@naql/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function NewMissionPage() {
  const session = await auth();
  const orgId = session?.user.organizationId;

  const [availableVehicles, clientList, driverList] = await withOrgContext(
    db,
    orgId,
    async (tx) => {
      const v = await tx
        .select({ id: vehicles.id, code: vehicles.code, make: vehicles.make })
        .from(vehicles)
        .where(sql`${vehicles.status} = 'available'`);

      const c = await tx.select({ id: clients.id, name: clients.name }).from(clients);

      const d = await tx
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.role, "driver"));

      return [v, c, d] as const;
    }
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Nouvelle mission</h1>
        <p className="text-slate-500 text-sm mt-1">Planifier une mission de transport</p>
      </div>
      <MissionForm vehicles={availableVehicles} clients={clientList} drivers={driverList} />
    </div>
  );
}
