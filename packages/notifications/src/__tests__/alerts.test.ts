import { describe, expect, it } from "vitest";
import type { Alert, AlertKind } from "../alerts";

describe("AlertKind type", () => {
  it("accepts valid alert kinds", () => {
    const kinds: AlertKind[] = [
      "document_expiry",
      "contract_renewal",
      "invoice_overdue",
      "over_consumption",
    ];
    expect(kinds).toHaveLength(4);
  });

  it("Alert interface has required fields", () => {
    const alert: Alert = {
      kind: "document_expiry",
      organizationId: "org-1",
      entityId: "doc-1",
      message: "Insurance expires soon",
      severity: "warning",
      at: new Date(),
    };
    expect(alert.kind).toBe("document_expiry");
    expect(alert.severity).toBe("warning");
  });
});
