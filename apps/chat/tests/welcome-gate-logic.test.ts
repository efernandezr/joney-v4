import { describe, expect, it } from "vitest";

import { shouldShowWelcomeGate } from "../app/lib/welcome-gate";

describe("shouldShowWelcomeGate", () => {
  it("gates a fresh member (exists: false, no error)", () => {
    expect(
      shouldShowWelcomeGate({
        hasThreadId: false,
        ritualStarted: false,
        personalAgentQuery: { data: { exists: false } },
      }),
    ).toBe(true);
  });

  it("does not gate once exists: true", () => {
    expect(
      shouldShowWelcomeGate({
        hasThreadId: false,
        ritualStarted: false,
        personalAgentQuery: { data: { exists: true } },
      }),
    ).toBe(false);
  });

  it("does not gate while on a thread route", () => {
    expect(
      shouldShowWelcomeGate({
        hasThreadId: true,
        ritualStarted: false,
        personalAgentQuery: { data: { exists: false } },
      }),
    ).toBe(false);
  });

  it("does not gate once the ritual has started", () => {
    expect(
      shouldShowWelcomeGate({
        hasThreadId: false,
        ritualStarted: true,
        personalAgentQuery: { data: { exists: false } },
      }),
    ).toBe(false);
  });

  it("does not gate an existing member when the query errors (safe default: show chat)", () => {
    expect(
      shouldShowWelcomeGate({
        hasThreadId: false,
        ritualStarted: false,
        personalAgentQuery: { isError: true, data: undefined },
      }),
    ).toBe(false);
  });
});
