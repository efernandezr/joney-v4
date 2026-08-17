import { defineAction } from "@agent-native/core/action";
import { describe, expect, it } from "vitest";
import { z } from "zod";

// Regression test for the patched @agent-native/core schema sanitizer
// (patches/@agent-native__core.patch). Zod v4's z.string().email() emits a
// JSON-schema `pattern` containing regex lookaheads, which OpenAI rejects for
// the whole request: "Invalid JSON schema: regex lookaround is not supported.
// Found at $.properties.memberEmails.items.pattern". The framework's built-in
// upsert-workspace-user-group action triggers this on the OpenAI engine.
// If this test fails after a framework upgrade, the patch was dropped or no
// longer applies — re-apply it or verify upstream fixed the sanitizer.
describe("action tool schema portability", () => {
  it("strips regex lookarounds that OpenAI rejects", () => {
    const action = defineAction({
      name: "repro-user-group",
      description: "mirrors upsert-workspace-user-group's memberEmails field",
      schema: z.object({
        memberEmails: z.array(z.string().email()).default([]),
      }),
      run: async () => ({}),
    });

    const items = (action.tool.parameters as any).properties.memberEmails.items;
    expect(items.format).toBe("email");
    expect(JSON.stringify(action.tool.parameters)).not.toMatch(/\(\?<?[=!]/);
  });
});
