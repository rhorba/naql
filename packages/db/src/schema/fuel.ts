import { index, integer, pgEnum, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { missions } from "./missions";
import { organizations } from "./organizations";
import { users } from "./users";
import { vehicles } from "./vehicles";

export const fuelSourceEnum = pgEnum("fuel_source", ["driver_app", "desktop", "ocr"]);

export const fuelLogs = pgTable(
  "fuel_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    driverId: text("driver_id").references(() => users.id),
    missionId: text("mission_id").references(() => missions.id),
    litres: real("litres").notNull(),
    pricePerLitre: integer("price_per_litre").notNull(),
    total: integer("total").notNull(),
    odometer: integer("odometer"),
    station: text("station"),
    filledAt: timestamp("filled_at", { withTimezone: true }).notNull(),
    receiptUrl: text("receipt_url"),
    ocrConfidence: real("ocr_confidence"),
    source: fuelSourceEnum("source").notNull().default("desktop"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("fuel_logs_org_idx").on(t.organizationId),
    index("fuel_logs_vehicle_idx").on(t.organizationId, t.vehicleId),
    index("fuel_logs_filled_at_idx").on(t.organizationId, t.filledAt),
  ]
);

export type FuelLogRow = typeof fuelLogs.$inferSelect;
export type NewFuelLogRow = typeof fuelLogs.$inferInsert;
