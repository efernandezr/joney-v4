import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

// Regression test for the ghost-thread restore path.
//
// History: a "New Chat" tab mints its thread id client-side and persists it to
// localStorage immediately, but the "this thread is new" marker lives only in
// memory. After a reload the restored id probes GET /threads/:id, gets a 404
// (no row exists until the first message), and core <= 0.159.2 rendered a
// permanent "Restore request failed" card. We carried a local patch until
// core 0.176.1, which handles the scenario natively; this test pins the two
// upstream behaviors we now rely on so a future framework upgrade that drops
// either one fails loudly here instead of regressing users:
//
// 1. AssistantChat skips the /threads/:id probe entirely for tabs it knows are
//    new in this session (no pointless 404 on startup).
// 2. MultiTabAssistantChat wires `onThreadRestoreNotFound` to clear the active
//    tab, so a 404 restore (the post-reload ghost-id case) resolves to a fresh
//    chat instead of a dead-end error card.
describe("thread restore ghost-id handling (upstream, core >= 0.176.1)", () => {
  const require = createRequire(import.meta.url);
  const clientDir = dirname(require.resolve("@agent-native/core/client"));
  const assistantChat = readFileSync(
    join(clientDir, "AssistantChat.js"),
    "utf8",
  );
  const multiTab = readFileSync(
    join(clientDir, "MultiTabAssistantChat.js"),
    "utf8",
  );

  it("skips the restore probe for same-session new tabs", () => {
    expect(assistantChat).toContain("threadId && isNewThread");
    const branch = assistantChat.slice(
      assistantChat.indexOf("threadId && isNewThread"),
    );
    expect(branch).toContain("setThreadRestoreError(null)");
  });

  it("notifies the host on a not-found restore instead of dead-ending", () => {
    expect(assistantChat).toContain("onThreadRestoreNotFound");
    expect(assistantChat).toContain('threadRestoreError !== "not-found"');
  });

  it("multi-tab host replaces a missing thread with a fresh chat", () => {
    expect(multiTab).toContain("onThreadRestoreNotFound");
    const wiring = multiTab.slice(multiTab.indexOf("onThreadRestoreNotFound"));
    expect(wiring).toContain("clearActiveTab");
  });
});
