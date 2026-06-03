import { ForbiddenError } from "@naql/core";
/**
 * Tests for the withTenant wrapper using vitest mocks.
 * We mock auth() and the DB context to test the middleware logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next-auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock @naql/db
vi.mock("@naql/db", () => ({
  db: {},
  withOrgContext: vi.fn(async (_db, _orgId, fn) => fn({})),
}));

import { auth } from "@/auth";
import { AuthError, withTenant } from "../lib/with-tenant";

const mockAuth = vi.mocked(auth);

const OWNER_SESSION = {
  user: {
    id: "user-1",
    organizationId: "org-1",
    role: "owner" as const,
    name: "Jamal",
    email: "jamal@test.ma",
  },
};

describe("withTenant wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws AuthError when no session", async () => {
    mockAuth.mockResolvedValueOnce(null as never);
    const action = withTenant(null, async () => "ok");
    await expect(action({})).rejects.toThrow(AuthError);
  });

  it("throws AuthError when session has no organizationId", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u1", role: "driver", email: "x@x.com" },
    } as never);
    const action = withTenant(null, async () => "ok");
    await expect(action({})).rejects.toThrow(AuthError);
  });

  it("calls handler with context when authenticated", async () => {
    mockAuth.mockResolvedValueOnce(OWNER_SESSION as never);
    const handler = vi.fn(async ({ orgId }) => orgId);
    const action = withTenant(null, handler);
    const result = await action({});
    expect(result).toBe("org-1");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("passes orgId, role, userId to handler", async () => {
    mockAuth.mockResolvedValueOnce(OWNER_SESSION as never);
    let capturedOrgId = "";
    let capturedRole = "";
    let capturedUserId = "";
    const action = withTenant(null, async (ctx) => {
      capturedOrgId = ctx.orgId;
      capturedRole = ctx.role;
      capturedUserId = ctx.userId;
      return "done";
    });
    await action({});
    expect(capturedOrgId).toBe("org-1");
    expect(capturedRole).toBe("owner");
    expect(capturedUserId).toBe("user-1");
  });

  it("throws ForbiddenError when role lacks capability", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u2", organizationId: "org-1", role: "driver", name: "Brahim", email: "b@t.ma" },
    } as never);
    const action = withTenant("fleet:write", async () => "ok");
    await expect(action({})).rejects.toThrow(ForbiddenError);
  });

  it("allows handler when role has capability", async () => {
    mockAuth.mockResolvedValueOnce(OWNER_SESSION as never);
    const action = withTenant("fleet:write", async () => "allowed");
    const result = await action({});
    expect(result).toBe("allowed");
  });

  it("driver can update own mission status (allowed capability)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u3", organizationId: "org-1", role: "driver", name: "Brahim", email: "b@t.ma" },
    } as never);
    const action = withTenant("missions:update_status", async () => "status-updated");
    const result = await action({});
    expect(result).toBe("status-updated");
  });

  it("AuthError has message 'Not authenticated'", () => {
    const err = new AuthError();
    expect(err.message).toBe("Not authenticated");
    expect(err.name).toBe("AuthError");
  });
});
