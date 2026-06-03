import { auth } from "@/auth";
import { MissionBoard } from "@/components/missions/mission-board";
import { Link } from "@/i18n/navigation";
import { db, withOrgContext } from "@naql/db";
import { clients, missions, vehicles } from "@naql/db/schema";
import { notFound } from "next/navigation";

export default async function MissionsPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const orgId = session.user.organizationId;

  const [missionList, vehicleList, clientList] = await withOrgContext(db, orgId, async (tx) => {
    const m = await tx
      .select({
        id: missions.id,
        status: missions.status,
        originCity: missions.originCity,
        destinationCity: missions.destinationCity,
        cargo: missions.cargo,
        agreedPrice: missions.agreedPrice,
        startDate: missions.startDate,
        endDate: missions.endDate,
        clientId: missions.clientId,
        vehicleId: missions.vehicleId,
        driverId: missions.driverId,
      })
      .from(missions)
      .orderBy(missions.startDate);

    const v = await tx
      .select({ id: vehicles.id, code: vehicles.code, status: vehicles.status })
      .from(vehicles);

    const c = await tx.select({ id: clients.id, name: clients.name }).from(clients);

    return [m, v, c] as const;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Missions</h1>
          <p className="text-slate-500 text-sm mt-1">
            {missionList.length} mission{missionList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/missions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition"
        >
          + Nouvelle mission
        </Link>
      </div>

      <MissionBoard missions={missionList} vehicles={vehicleList} clients={clientList} />
    </div>
  );
}
