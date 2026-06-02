import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "partial",
  "paid",
  "overdue",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank", "cheque", "other"]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "fuel",
  "maintenance",
  "tolls",
  "salary",
  "admin",
  "other",
]);

export const invoices = pgTable(
  "invoices",
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
    number: text("number").notNull(),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    lines: jsonb("lines").notNull().$type<
      Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
      }>
    >(),
    subtotal: integer("subtotal").notNull(),
    vatRate: real("vat_rate").notNull().default(0.2),
    vatAmount: integer("vat_amount").notNull(),
    total: integer("total").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("invoices_org_idx").on(t.organizationId),
    index("invoices_org_status_idx").on(t.organizationId, t.status),
    unique("invoices_org_number_unique").on(t.organizationId, t.number),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: text("invoice_id").references(() => invoices.id),
    amount: integer("amount").notNull(),
    method: paymentMethodEnum("method").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_org_idx").on(t.organizationId)]
);

export const expenses = pgTable(
  "expenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id"),
    category: expenseCategoryEnum("category").notNull(),
    amount: integer("amount").notNull(),
    spentAt: timestamp("spent_at", { withTimezone: true }).notNull(),
    receiptUrl: text("receipt_url"),
    source: text("source").notNull().default("manual"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("expenses_org_idx").on(t.organizationId),
    index("expenses_org_date_idx").on(t.organizationId, t.spentAt),
  ]
);

export type InvoiceRow = typeof invoices.$inferSelect;
export type NewInvoiceRow = typeof invoices.$inferInsert;
export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpenseRow = typeof expenses.$inferInsert;
