import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";
import { vehicles } from "./vehicles";

export const missionStatusEnum = pgEnum("mission_status", [
  "planned",
  "in_progress",
  "completed",
  "invoiced",
  "cancelled",
]);

export const missions = pgTable(
  "missions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),
    vehicleId: text("vehicle_id").references(() => vehicles.id),
    driverId: text("driver_id").references(() => users.id),
    originCity: text("origin_city").notNull(),
    destinationCity: text("destination_city").notNull(),
    cargo: text("cargo"),
    agreedPrice: integer("agreed_price").notNull(),
    status: missionStatusEnum("status").notNull().default("planned"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    proofOfDeliveryUrl: text("proof_of_delivery_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("missions_org_idx").on(t.organizationId),
    index("missions_org_status_idx").on(t.organizationId, t.status),
    index("missions_org_start_date_idx").on(t.organizationId, t.startDate),
  ]
);

export type MissionRow = typeof missions.$inferSelect;
export type NewMissionRow = typeof missions.$inferInsert;
