import { describe, expect, it } from "vitest";

import saveBrainEntry from "../actions/save-brain-entry";
import searchBrain from "../actions/search-brain";

// Regression for the prod thread where "save to Brain that …" made the model
// delegate to a connected agent named "Brain" via call-agent — there is no
// such workspace app, so the 0.176 fail-closed ACL returned an authorization
// error and nothing was saved. The same phrasing with "my Brain" routed to
// save-brain-entry and worked. Descriptions are the one agent-facing surface
// that is always in the tool context (instructions resources are lazy), so
// they must own the "Brain" vocabulary explicitly: this app's brain actions
// ARE the member's Brain; never a connected agent.
describe("brain action descriptions own the 'Brain' vocabulary", () => {
  it("save-brain-entry claims 'save to Brain' phrasing and forbids delegating to a Brain agent", () => {
    const d = saveBrainEntry.tool.description ?? "";
    expect(d).toMatch(/["'“”]?My Brain["'“”]?/i);
    expect(d).toMatch(/this app/i);
    expect(d).toMatch(/connected agent/i);
  });

  it("search-brain claims Brain lookups and forbids delegating to a Brain agent", () => {
    const d = searchBrain.tool.description ?? "";
    expect(d).toMatch(/["'“”]?My Brain["'“”]?/i);
    expect(d).toMatch(/connected agent/i);
  });
});
