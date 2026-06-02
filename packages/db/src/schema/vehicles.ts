import { index, integer, pgEnum, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "on_mission",
  "maintenance",
  "out_of_service",
]);

export const vehicleTypeEnum = pgEnum("vehicle_type", ["truck", "van", "trailer", "other"]);

export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    registration: text("registration").notNull(),
    make: text("make"),
    model: text("model"),
    year: integer("year"),
    type: vehicleTypeEnum("type"),
    capacityKg: real("capacity_kg"),
    baselineConsumption: real("baseline_consumption"),
    status: vehicleStatusEnum("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vehicles_org_idx").on(t.organizationId),
    index("vehicles_org_status_idx").on(t.organizationId, t.status),
  ]
);

export const vehicleDocumentKindEnum = pgEnum("vehicle_document_kind", [
  "insurance",
  "technical_inspection",
  "license",
  "other",
]);

export const vehicleDocuments = pgTable(
  "vehicle_documents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    kind: vehicleDocumentKindEnum("kind").notNull(),
    reference: text("reference"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    fileUrl: text("file_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vehicle_documents_org_idx").on(t.organizationId),
    index("vehicle_documents_expires_idx").on(t.expiresAt),
  ]
);

export type VehicleRow = typeof vehicles.$inferSelect;
export type NewVehicleRow = typeof vehicles.$inferInsert;
export type VehicleDocumentRow = typeof vehicleDocuments.$inferSelect;
export type NewVehicleDocumentRow = typeof vehicleDocuments.$inferInsert;
