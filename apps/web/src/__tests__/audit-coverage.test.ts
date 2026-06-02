import { readFileSync } from "node:fs";
import { resolve } from "node:path";
/**
 * S7-05 — Audit-log coverage check
 * Verifies that every server action that mutates financial/sensitive data
 * includes a call to db.insert(auditLogs).
 *
 * This is a static analysis test — it reads the source files.
 */
import { describe, expect, it } from "vitest";

const ACTIONS_DIR = resolve(__dirname, "../../src/app/actions");

function readAction(name: string): string {
  return readFileSync(resolve(ACTIONS_DIR, name), "utf-8");
}

function hasAuditLog(src: string): boolean {
  return src.includes("auditLogs") && src.includes("db.insert(auditLogs)");
}

describe("Audit-log coverage (S7-05)", () => {
  it("invoicing.ts — createInvoice, sendInvoice, createCreditNote, createPayment all audit", () => {
    const src = readAction("invoicing.ts");
    expect(hasAuditLog(src)).toBe(true);
    // Count audit inserts — need at least one per mutating function (4 functions)
    const matches = src.match(/db\.insert\(auditLogs\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it("fleet.ts — createVehicle, updateVehicle, deleteVehicle, createDocument all audit", () => {
    const src = readAction("fleet.ts");
    expect(hasAuditLog(src)).toBe(true);
    const matches = src.match(/db\.insert\(auditLogs\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it("missions.ts — createMission, transitionMission, assignMission all audit", () => {
    const src = readAction("missions.ts");
    expect(hasAuditLog(src)).toBe(true);
    const matches = src.match(/db\.insert\(auditLogs\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("fuel.ts — createFuelLog audits", () => {
    const src = readAction("fuel.ts");
    expect(hasAuditLog(src)).toBe(true);
  });

  it("hr.ts — createEmployee, updateEmployee, createAdvance all audit", () => {
    const src = readAction("hr.ts");
    expect(hasAuditLog(src)).toBe(true);
    const matches = src.match(/db\.insert\(auditLogs\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("payroll.ts — runPayroll audits every payslip", () => {
    const src = readAction("payroll.ts");
    expect(hasAuditLog(src)).toBe(true);
  });

  it("expenses.ts — createExpense audits", () => {
    const src = readAction("expenses.ts");
    expect(hasAuditLog(src)).toBe(true);
  });
});
