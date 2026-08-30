/**
 * Pure decision for whether `/` should show the first-run "create your
 * personal agent" gate instead of the normal chat surface.
 *
 * Extracted out of `app/routes/_index.tsx` so the guard logic (including the
 * error-state fallback) is unit-testable without rendering the route.
 */
export interface WelcomeGateParams {
  /** Present when viewing an existing thread (`/chat/:threadId`). */
  hasThreadId: boolean;
  /** Sticky flag: true for the rest of the session once the birth ritual starts. */
  ritualStarted: boolean;
  /** `get-personal-agent` query result. */
  personalAgentQuery: {
    data?: { exists: boolean };
    isError?: boolean;
  };
}

export function shouldShowWelcomeGate({
  hasThreadId,
  ritualStarted,
  personalAgentQuery,
}: WelcomeGateParams): boolean {
  if (hasThreadId || ritualStarted) return false;
  // If the query errored, don't gate an established member behind a panel
  // that can never resolve to `exists: true` — fall back to the normal chat
  // surface, the safe default when we can't confirm agent state.
  if (personalAgentQuery.isError) return false;
  return personalAgentQuery.data?.exists !== true;
}
