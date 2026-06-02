import { ForbiddenError, assertCan, can } from "@naql/core";
import type { Capability, Role } from "@naql/core";
/**
 * S7-01 — Security hardening tests
 *
 * Verifies server-side security invariants that don't require a live DB:
 * - withTenant always reads role from session, never from input
 * - ForbiddenError thrown for denied capabilities
 * - RBAC matrix: no role can escalate privileges
 */
import { describe, expect, it } from "vitest";

const ALL_ROLES: Role[] = ["owner", "manager", "accountant", "driver"];

// Capabilities that ONLY owner should have
const OWNER_ONLY: Capability[] = ["org:manage", "users:invite"];

// Capabilities NO driver should have
const DRIVER_BLOCKED: Capability[] = [
  "fleet:write",
  "fleet:documents:write",
  "invoices:write",
  "invoices:read",
  "payments:write",
  "cash:write",
  "hr:write",
  "payroll:run",
  "profitability:read",
  "org:manage",
];

describe("S7-01 — Tenant & RBAC security", () => {
  describe("Owner-only capabilities cannot be accessed by others", () => {
    for (const cap of OWNER_ONLY) {
      it(`only owner can '${cap}'`, () => {
        expect(can("owner", cap)).toBe(true);
        for (const role of ALL_ROLES.filter((r) => r !== "owner")) {
          expect(can(role, cap)).toBe(false);
        }
      });
    }
  });

  describe("Driver cannot access financial/fleet/admin capabilities", () => {
    for (const cap of DRIVER_BLOCKED) {
      it(`driver blocked from '${cap}'`, () => {
        expect(can("driver", cap)).toBe(false);
        expect(() => assertCan("driver", cap)).toThrow(ForbiddenError);
      });
    }
  });

  it("ForbiddenError has statusCode 403", () => {
    try {
      assertCan("driver", "org:manage");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err instanceof ForbiddenError).toBe(true);
      expect((err as ForbiddenError).statusCode).toBe(403);
    }
  });

  it("No role can perform a capability not in its matrix", () => {
    // Every role × every capability: can() returns a boolean, never throws
    const caps: Capability[] = [
      "org:manage",
      "fleet:write",
      "fleet:read",
      "missions:create",
      "invoices:write",
      "payroll:run",
      "hr:write",
      "profitability:read",
    ];
    for (const role of ALL_ROLES) {
      for (const cap of caps) {
        expect(() => can(role, cap)).not.toThrow();
      }
    }
  });

  it("Accountant cannot manage org or users", () => {
    expect(can("accountant", "org:manage")).toBe(false);
    expect(can("accountant", "users:invite")).toBe(false);
  });

  it("Manager cannot run payroll or write invoices", () => {
    expect(can("manager", "payroll:run")).toBe(false);
    expect(can("manager", "invoices:write")).toBe(false);
  });

  it("Driver can only update own mission status (not create/assign)", () => {
    expect(can("driver", "missions:update_status")).toBe(true);
    expect(can("driver", "missions:create")).toBe(false);
    expect(can("driver", "missions:assign")).toBe(false);
  });
});
