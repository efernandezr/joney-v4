import { describe, expect, it } from "vitest";

import deleteBrainEntry from "../actions/delete-brain-entry";
import reviewBrainEntry from "../actions/review-brain-entry";
import updateBrainEntry from "../actions/update-brain-entry";

// Regression guard: `http: false` tells mountActionRoutes to skip mounting
// the action's HTTP endpoint entirely (see
// node_modules/@agent-native/core/dist/server/action-routes.js). These three
// actions are driven from the UI via useActionMutation (BrainProposalCard's
// Keep/Dismiss buttons today, the upcoming My Brain page next), which only
// ever calls the HTTP route — never `.run()` directly. `http: false` here
// silently 404s every click. Unit tests that call `.run()` directly (as the
// action tests do) can't catch this, so pin the contract explicitly instead.
describe("brain UI-mutation actions stay HTTP-reachable", () => {
  it.each([
    ["review-brain-entry", reviewBrainEntry],
    ["update-brain-entry", updateBrainEntry],
    ["delete-brain-entry", deleteBrainEntry],
  ])("%s does not declare http: false", (_name, action) => {
    expect(action.http).not.toBe(false);
  });
});
