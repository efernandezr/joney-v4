// tests/agent-chat-persona-prompt.test.ts
//
// Regression guard for Finding 2: this app runs the framework's default
// `lazyContext: true`, so personal `instructions/*.md` resources (the
// persona and brain digest) are only LISTED in the prompt, not included by
// default. The system prompt must not promise they "may be present" without
// also telling the agent to load them itself when they aren't. This test
// doesn't import server/plugins/agent-chat.ts directly (constructing the
// plugin has side effects — it wires the static actions registry and Nitro
// plugin machinery) and instead pins the prompt text at the source level.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pluginPath = fileURLToPath(
  new URL("../server/plugins/agent-chat.ts", import.meta.url),
);

describe("agent-chat system prompt: personal-agent persona/digest injection", () => {
  it("instructs the agent to read the persona/digest resources itself when not already in context", () => {
    const source = readFileSync(pluginPath, "utf8");
    expect(source).toContain("instructions/personal-agent.md");
    expect(source).toContain("instructions/personal-brain.md");
    // The old wording ("may be present in your context") gave no fallback
    // instruction if lazyContext only listed them; the fix must tell the
    // agent to actively load them via the resources tool.
    expect(source).toMatch(/read both with the resources tool/i);
    expect(source).not.toMatch(/may be present in your context/i);
  });
});
