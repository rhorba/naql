import { db, withOrgContext } from "@naql/db";
import { clients, missions } from "@naql/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let driverUserId: string;
  let orgId: string;

  try {
    const { payload } = await jwtVerify(authHeader.slice(7), secret);
    if (payload.role !== "driver") {
      return NextResponse.json({ error: "Driver role required" }, { status: 403 });
    }
    driverUserId = payload.sub as string;
    orgId = payload.orgId as string;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const driverMissions = await withOrgContext(db, orgId, async (tenantDb) => {
    const missionList = await tenantDb
      .select()
      .from(missions)
      .where(
        and(
          eq(missions.organizationId, orgId),
          eq(missions.driverId, driverUserId),
          sql`${missions.status} IN ('planned','in_progress','completed')`
        )
      )
      .orderBy(missions.startDate);

    const clientIds = [...new Set(missionList.map((m) => m.clientId))];
    const clientList =
      clientIds.length > 0
        ? await tenantDb.select({ id: clients.id, name: clients.name }).from(clients)
        : [];

    const clientMap = new Map(clientList.map((c) => [c.id, c.name]));
    return missionList.map((m) => ({
      ...m,
      clientName: clientMap.get(m.clientId) ?? "—",
    }));
  });

  return NextResponse.json({ missions: driverMissions });
}
