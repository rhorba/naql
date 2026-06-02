import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const orgPlanEnum = pgEnum("org_plan", ["trial", "pro", "enterprise"]);
export const orgLocaleEnum = pgEnum("org_locale", ["fr", "ar", "en"]);

export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  ice: text("ice"),
  currency: text("currency").notNull().default("MAD"),
  locale: orgLocaleEnum("locale").notNull().default("fr"),
  plan: orgPlanEnum("plan").notNull().default("trial"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrganizationRow = typeof organizations.$inferSelect;
export type NewOrganizationRow = typeof organizations.$inferInsert;
