import { describe, it, expect } from "vitest";
import { runAlertSweep } from "../alerts";

describe("runAlertSweep stub", () => {
  it("returns empty array (no-op stub)", async () => {
    const result = await runAlertSweep("org-123");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("accepts any organizationId", async () => {
    const result = await runAlertSweep("any-org-id");
    expect(result).toHaveLength(0);
  });
});
