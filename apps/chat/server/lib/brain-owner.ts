import { getRequestContext } from "@agent-native/core/server";

/**
 * Resolves the authenticated brain owner from an action's run context. Every
 * brain read/write is scoped to this owner; actions must throw rather than
 * fall back to a shared/dev identity when no user is signed in.
 *
 * Falls back to the request-scoped identity (`getRequestContext()`, a plain
 * AsyncLocalStorage read backed by `runWithRequestContext`) when `ctx` itself
 * doesn't carry `userEmail` — e.g. direct `action.run(args)` calls (tests,
 * scripts) that don't thread the dispatcher's `ctx` through.
 *
 * Deliberately NOT `getRequestUserEmail()`/`getRequestOrgId()`: those fall
 * through to `process.env.AGENT_USER_EMAIL`/`AGENT_ORG_ID` when there is no
 * active AsyncLocalStorage store, which the framework's own docs flag as a
 * "TRAP" for request handlers — it authorizes whoever the deploy env names
 * rather than whoever signed in (fails open). `getRequestContext()` has no
 * such env fallback, so a call with no active request context and no `ctx`
 * still throws below, keeping this fail-closed.
 */
export function ownerFromCtx(
  ctx: { userEmail?: string | null; orgId?: string | null } | undefined,
): { email: string; orgId: string | null } {
  const requestCtx = getRequestContext();
  const email = (ctx?.userEmail ?? requestCtx?.userEmail)?.trim().toLowerCase();
  if (!email) throw new Error("This action requires a signed-in user");
  return { email, orgId: ctx?.orgId ?? requestCtx?.orgId ?? null };
}
