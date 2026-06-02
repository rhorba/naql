import { auth } from "@/auth";
import { ForbiddenError, assertCan } from "@naql/core";
import type { Capability, Role } from "@naql/core";
import { db, withOrgContext } from "@naql/db";
import type { Database } from "@naql/db";

export interface TenantContext {
  db: Database;
  orgId: string;
  role: Role;
  userId: string;
}

export class AuthError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "AuthError";
  }
}

/**
 * Server action / route handler wrapper.
 * 1. Reads session — throws if unauthenticated
 * 2. Sets app.current_org GUC for RLS
 * 3. Checks RBAC capability if provided
 * 4. Passes tenant-scoped db context to handler
 */
export function withTenant<TInput, TOutput>(
  capability: Capability | null,
  handler: (ctx: TenantContext, input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<TOutput> => {
    const session = await auth();
    if (!session?.user?.organizationId) throw new AuthError();

    const { id: userId, organizationId: orgId, role } = session.user;

    if (capability) {
      assertCan(role, capability); // throws ForbiddenError if denied
    }

    return withOrgContext(db, orgId, async (tenantDb) => {
      return handler({ db: tenantDb, orgId, role, userId }, input);
    });
  };
}

export { ForbiddenError };
