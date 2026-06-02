import { index, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const alertKindEnum = pgEnum("alert_kind", [
  "document_expiry",
  "contract_renewal",
  "invoice_overdue",
  "over_consumption",
]);

export const alertSeverityEnum = pgEnum("alert_severity", ["info", "warning", "critical"]);

export const alerts = pgTable(
  "alerts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    kind: alertKindEnum("kind").notNull(),
    entityId: text("entity_id").notNull(),
    message: text("message").notNull(),
    severity: alertSeverityEnum("severity").notNull().default("warning"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("alerts_org_idx").on(t.organizationId),
    index("alerts_org_kind_idx").on(t.organizationId, t.kind),
    // Dedup key: one active alert per (org, kind, entity)
    index("alerts_org_kind_entity_idx").on(t.organizationId, t.kind, t.entityId),
    // Dashboard query: active alerts per org (resolvedAt IS NULL filter)
    index("alerts_org_resolved_idx").on(t.organizationId, t.resolvedAt),
  ]
);

export const invoiceNumberSequences = pgTable(
  "invoice_number_sequences",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    year: text("year").notNull(),
    lastSequence: text("last_sequence").notNull().default("0"),
  },
  (t) => [unique("invoice_seq_org_year_unique").on(t.organizationId, t.year)]
);

export type AlertRow = typeof alerts.$inferSelect;
export type NewAlertRow = typeof alerts.$inferInsert;
