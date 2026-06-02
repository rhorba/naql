import { describe, expect, it } from "vitest";
import { ForbiddenError, assertCan, can } from "../rbac";
import type { Capability, Role } from "../rbac";

const allRoles: Role[] = ["owner", "manager", "accountant", "driver"];

describe("RBAC matrix", () => {
  // Owner has everything
  it("owner can do everything", () => {
    const ownerCaps: Capability[] = [
      "org:manage",
      "fleet:write",
      "missions:create",
      "invoices:write",
      "payroll:run",
      "hr:write",
      "cash:write",
      "profitability:read",
    ];
    for (const cap of ownerCaps) {
      expect(can("owner", cap)).toBe(true);
    }
  });

  // Driver restrictions
  it("driver cannot write fleet", () => {
    expect(can("driver", "fleet:write")).toBe(false);
  });

  it("driver cannot read invoices", () => {
    expect(can("driver", "invoices:read")).toBe(false);
  });

  it("driver cannot access profitability", () => {
    expect(can("driver", "profitability:read")).toBe(false);
  });

  it("driver cannot run payroll", () => {
    expect(can("driver", "payroll:run")).toBe(false);
  });

  it("driver can update own mission status", () => {
    expect(can("driver", "missions:update_status")).toBe(true);
  });

  it("driver can create own fuel log", () => {
    expect(can("driver", "fuel:own:write")).toBe(true);
  });

  // Accountant
  it("accountant can write invoices", () => {
    expect(can("accountant", "invoices:write")).toBe(true);
  });

  it("accountant cannot write fleet", () => {
    expect(can("accountant", "fleet:write")).toBe(false);
  });

  it("accountant cannot manage org settings", () => {
    expect(can("accountant", "org:manage")).toBe(false);
  });

  // Manager
  it("manager can create missions", () => {
    expect(can("manager", "missions:create")).toBe(true);
  });

  it("manager cannot write invoices", () => {
    expect(can("manager", "invoices:write")).toBe(false);
  });

  it("manager cannot run payroll", () => {
    expect(can("manager", "payroll:run")).toBe(false);
  });

  // assertCan throws
  it("assertCan throws ForbiddenError for denied capability", () => {
    expect(() => assertCan("driver", "fleet:write")).toThrow(ForbiddenError);
  });

  it("assertCan does not throw for allowed capability", () => {
    expect(() => assertCan("owner", "fleet:write")).not.toThrow();
  });

  // Cross-role: no role can bypass org:manage except owner
  it("only owner can manage org", () => {
    const nonOwners = allRoles.filter((r) => r !== "owner");
    for (const role of nonOwners) {
      expect(can(role, "org:manage")).toBe(false);
    }
  });
});
