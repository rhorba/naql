import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const contractTypeEnum = pgEnum("contract_type", ["cdi", "cdd", "interim"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "leave"]);

export const employees = pgTable(
  "employees",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id),
    fullName: text("full_name").notNull(),
    role: text("role").notNull(),
    baseSalary: integer("base_salary").notNull(),
    contractType: contractTypeEnum("contract_type"),
    contractEndsAt: timestamp("contract_ends_at", { withTimezone: true }),
    cnssNumber: text("cnss_number"),
    licenseNumber: text("license_number"),
    licenseExpiresAt: timestamp("license_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("employees_org_idx").on(t.organizationId),
    index("employees_contract_ends_idx").on(t.contractEndsAt),
  ]
);

export const attendance = pgTable(
  "attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    date: timestamp("date", { withTimezone: true }).notNull(),
    status: attendanceStatusEnum("status").notNull(),
    hours: real("hours"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attendance_org_employee_idx").on(t.organizationId, t.employeeId)]
);

export const advances = pgTable(
  "advances",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    amount: integer("amount").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
    repaid: boolean("repaid").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("advances_org_idx").on(t.organizationId)]
);

export type EmployeeRow = typeof employees.$inferSelect;
export type NewEmployeeRow = typeof employees.$inferInsert;
export type AttendanceRow = typeof attendance.$inferSelect;
export type NewAttendanceRow = typeof attendance.$inferInsert;
export type AdvanceRow = typeof advances.$inferSelect;
export type NewAdvanceRow = typeof advances.$inferInsert;
