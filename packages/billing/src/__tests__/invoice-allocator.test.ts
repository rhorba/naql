import { describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", () => ({ sql: vi.fn((s) => s) }));
vi.mock("@naql/db/schema", () => ({
  invoiceNumberSequences: {
    organizationId: "organization_id",
    year: "year",
    lastSequence: "last_sequence",
  },
}));

import { allocateInvoiceNumber } from "../invoice-allocator";

function makeDb(seq) {
  const execute = vi
    .fn()
    .mockResolvedValueOnce([]) // advisory lock (returns row[])
    .mockResolvedValueOnce([{ last_sequence: seq }]); // UPDATE RETURNING (array of rows)
  const insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
  });
  return {
    transaction: vi.fn(async (fn) => fn({ execute, insert })),
    _execute: execute,
  };
}

describe("allocateInvoiceNumber", () => {
  it("returns INV-2026-0001 for sequence 1", async () => {
    expect(await allocateInvoiceNumber(makeDb("1"), "org-1", 2026)).toBe("INV-2026-0001");
  });

  it("returns INV-2026-0042 for sequence 42", async () => {
    expect(await allocateInvoiceNumber(makeDb("42"), "org-1", 2026)).toBe("INV-2026-0042");
  });

  it("returns INV-2026-1000 for sequence 1000", async () => {
    expect(await allocateInvoiceNumber(makeDb("1000"), "org-1", 2026)).toBe("INV-2026-1000");
  });

  it("runs inside a transaction", async () => {
    const db = makeDb("1");
    await allocateInvoiceNumber(db, "org-1", 2026);
    expect(db.transaction).toHaveBeenCalledOnce();
  });

  it("first execute call contains pg_advisory_xact_lock", async () => {
    const db = makeDb("5");
    await allocateInvoiceNumber(db, "org-1", 2026);
    expect(String(db._execute.mock.calls[0][0])).toContain("pg_advisory_xact_lock");
  });

  it("second execute call contains UPDATE", async () => {
    const db = makeDb("3");
    await allocateInvoiceNumber(db, "org-1", 2026);
    expect(String(db._execute.mock.calls[1][0])).toContain("last_sequence");
  });

  it("different years produce different prefixes", async () => {
    const r2026 = await allocateInvoiceNumber(makeDb("1"), "org-1", 2026);
    const r2027 = await allocateInvoiceNumber(makeDb("1"), "org-1", 2027);
    expect(r2026).toContain("2026");
    expect(r2027).toContain("2027");
  });
});
