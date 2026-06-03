import { describe, expect, it, vi } from "vitest";

// Mock drizzle-orm before importing module under test
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args) => args),
  sql: vi.fn((s) => s),
  isNull: vi.fn((c) => c),
  lte: vi.fn((a, b) => [a, b]),
}));

vi.mock("@naql/db/schema", () => ({
  alerts: { organizationId: "org_id", kind: "kind", entityId: "entity_id", resolvedAt: "resolved_at" },
  vehicleDocuments: { id: "id", kind: "kind", expiresAt: "expires_at" },
  employees: { id: "id", fullName: "full_name", contractEndsAt: "contract_ends_at" },
  invoices: { id: "id", number: "number", dueDate: "due_date", status: "status" },
}));

import { runAlertSweep } from "../alert-sweep";

const FUTURE = new Date(Date.now() + 5 * 864e5);
const PAST = new Date(Date.now() - 2 * 864e5);

function makeDb(docs = [], contracts = [], invoiceRows = []) {
  let n = 0;
  const rows = [docs, contracts, invoiceRows];
  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(rows[n++] ?? []),
    })),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  };
}

describe("runAlertSweep", () => {
  it("returns [] when nothing is expiring", async () => {
    const db = makeDb();
    expect(await runAlertSweep(db, "org-1")).toHaveLength(0);
  });

  it("includes doc id when document is expiring", async () => {
    const db = makeDb([{ id: "doc-1", kind: "insurance", expiresAt: FUTURE }]);
    const r = await runAlertSweep(db, "org-1");
    expect(r).toContain("doc-1");
    expect(db.insert).toHaveBeenCalled();
  });

  it("handles expired document (past date)", async () => {
    const db = makeDb([{ id: "doc-x", kind: "technical_inspection", expiresAt: PAST }]);
    await runAlertSweep(db, "org-1");
    expect(db.insert).toHaveBeenCalled();
  });

  it("includes employee id for expiring contract", async () => {
    const db = makeDb([], [{ id: "emp-1", fullName: "Karim", contractEndsAt: FUTURE }]);
    const r = await runAlertSweep(db, "org-1");
    expect(r).toContain("emp-1");
  });

  it("skips contract with null contractEndsAt", async () => {
    const db = makeDb([], [{ id: "emp-2", fullName: "Ali", contractEndsAt: null }]);
    const r = await runAlertSweep(db, "org-1");
    expect(r).not.toContain("emp-2");
  });

  it("includes invoice id for overdue invoice", async () => {
    const db = makeDb([], [], [{ id: "inv-1", number: "INV-001", dueDate: PAST }]);
    const r = await runAlertSweep(db, "org-1");
    expect(r).toContain("inv-1");
  });

  it("deduplicates: calls delete before insert", async () => {
    const db = makeDb([{ id: "d1", kind: "insurance", expiresAt: FUTURE }]);
    await runAlertSweep(db, "org-1");
    expect(db.delete).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("handles multiple items across all categories", async () => {
    const db = makeDb(
      [{ id: "doc-a", kind: "insurance", expiresAt: FUTURE }],
      [{ id: "emp-a", fullName: "X", contractEndsAt: FUTURE }],
      [{ id: "inv-a", number: "INV-001", dueDate: PAST }]
    );
    const r = await runAlertSweep(db, "org-1");
    expect(r.length).toBeGreaterThanOrEqual(3);
  });
});