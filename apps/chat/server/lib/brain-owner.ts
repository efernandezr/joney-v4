import { getRequestOrgId, getRequestUserEmail } from "@agent-native/core/server";

/**
 * Resolves the authenticated brain owner from an action's run context. Every
 * brain read/write is scoped to this owner; actions must throw rather than
 * fall back to a shared/dev identity when no user is signed in.
 *
 * Falls back to the request-scoped identity (`getRequestUserEmail` /
 * `getRequestOrgId`, backed by `runWithRequestContext`'s AsyncLocalStorage)
 * when `ctx` itself doesn't carry `userEmail` — e.g. direct `action.run(args)`
 * calls (tests, scripts) that don't thread the dispatcher's `ctx` through.
 */
export function ownerFromCtx(
  ctx: { userEmail?: string | null; orgId?: string | null } | undefined,
): { email: string; orgId: string | null } {
  const email = (ctx?.userEmail ?? getRequestUserEmail())?.trim().toLowerCase();
  if (!email) throw new Error("This action requires a signed-in user");
  return { email, orgId: ctx?.orgId ?? getRequestOrgId() ?? null };
}
