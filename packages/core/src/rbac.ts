import type { Role } from "./types";
export type { Role };

// Every capability string in the system. Format: "resource:action"
export type Capability =
  // Org & users
  | "org:manage"
  | "users:invite"
  | "users:read"
  // Fleet
  | "fleet:write"
  | "fleet:read"
  | "fleet:documents:write"
  | "fleet:documents:read"
  // Missions
  | "missions:create"
  | "missions:assign"
  | "missions:read"
  | "missions:update_status"
  // Fuel
  | "fuel:write"
  | "fuel:read"
  | "fuel:own:write"
  // Invoicing
  | "invoices:write"
  | "invoices:read"
  | "payments:write"
  | "payments:read"
  // Cash / expenses
  | "cash:write"
  | "cash:read"
  | "expenses:write"
  | "expenses:read"
  | "expenses:own:write"
  // Profitability
  | "profitability:read"
  // HR
  | "hr:write"
  | "hr:read"
  | "payroll:run"
  | "attendance:write"
  | "attendance:read"
  | "attendance:own:write"
  | "advances:write"
  | "advances:read"
  | "advances:own:read";

const OWNER: Capability[] = [
  "org:manage",
  "users:invite",
  "users:read",
  "fleet:write",
  "fleet:read",
  "fleet:documents:write",
  "fleet:documents:read",
  "missions:create",
  "missions:assign",
  "missions:read",
  "missions:update_status",
  "fuel:write",
  "fuel:read",
  "fuel:own:write",
  "invoices:write",
  "invoices:read",
  "payments:write",
  "payments:read",
  "cash:write",
  "cash:read",
  "expenses:write",
  "expenses:read",
  "expenses:own:write",
  "profitability:read",
  "hr:write",
  "hr:read",
  "payroll:run",
  "attendance:write",
  "attendance:read",
  "attendance:own:write",
  "advances:write",
  "advances:read",
  "advances:own:read",
];

const MANAGER: Capability[] = [
  "users:read",
  "fleet:write",
  "fleet:read",
  "fleet:documents:write",
  "fleet:documents:read",
  "missions:create",
  "missions:assign",
  "missions:read",
  "missions:update_status",
  "fuel:write",
  "fuel:read",
  "fuel:own:write",
  "invoices:read",
  "payments:read",
  "cash:read",
  "expenses:read",
  "profitability:read",
  "hr:read",
  "attendance:read",
  "advances:read",
];

const ACCOUNTANT: Capability[] = [
  "users:read",
  "fleet:read",
  "fleet:documents:read",
  "missions:read",
  "fuel:read",
  "invoices:write",
  "invoices:read",
  "payments:write",
  "payments:read",
  "cash:write",
  "cash:read",
  "expenses:write",
  "expenses:read",
  "profitability:read",
  "hr:read",
  "payroll:run",
  "attendance:read",
  "advances:read",
];

const DRIVER: Capability[] = [
  "missions:read",
  "missions:update_status",
  "fuel:own:write",
  "fuel:read",
  "expenses:own:write",
  "attendance:own:write",
  "advances:own:read",
  "fleet:read",
];

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  owner: OWNER,
  manager: MANAGER,
  accountant: ACCOUNTANT,
  driver: DRIVER,
};

export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(role: Role, capability: Capability) {
    super(`Role '${role}' cannot perform '${capability}'`);
    this.name = "ForbiddenError";
  }
}

// Throws ForbiddenError if the role lacks the capability
export function assertCan(role: Role, capability: Capability): void {
  if (!can(role, capability)) {
    throw new ForbiddenError(role, capability);
  }
}

export function getRoleCapabilities(role: Role): Capability[] {
  return ROLE_CAPABILITIES[role];
}
