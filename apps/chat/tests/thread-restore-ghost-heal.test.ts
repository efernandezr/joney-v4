import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

// Regression test for the patched @agent-native/core thread-restore path
// (patches/@agent-native__core.patch, dist/client/AssistantChat.js hunk).
//
// A "New Chat" tab mints its thread id client-side and persists it to
// localStorage immediately, but the "this thread is new" marker lives only in
// memory. After a reload the restored id probes GET /threads/:id, gets a 404
// (no row exists until the first message), and unpatched code renders a
// permanent "Restore request failed" card whose Retry can never succeed. The
// patch self-heals that case into a fresh empty chat when the thread has no
// local or cached messages, while a 404 for a thread WITH content still
// surfaces the visible error.
//
// The client effect needs a full React render harness to exercise directly,
// so this asserts the patched source instead. If this fails after a framework
// upgrade, the patch hunk was dropped or no longer applies — re-apply it or
// verify upstream fixed the restore path (look for 404 handling that does not
// unconditionally set a restore error).
describe("thread restore ghost-id self-heal patch", () => {
  const require = createRequire(import.meta.url);
  // dist/client/AssistantChat.js is not an exported subpath; anchor on the
  // exported ./client entry (dist/client/index.js) and read its sibling.
  const source = readFileSync(
    join(dirname(require.resolve("@agent-native/core/client")), "AssistantChat.js"),
    "utf8",
  );

  it("keeps the self-heal branch for 404s on empty threads", () => {
    expect(source).toContain("ghost id: a client-minted tab");
    const branch = source.slice(source.indexOf("ghost id: a client-minted tab"));
    // Empty thread (no local messages, no cached snapshot) → no error surface.
    expect(branch).toContain(
      "if (!hasLocalMessages && !initialCachedThreadSnapshot)",
    );
    expect(branch).toContain("setThreadRestoreError(null)");
    // A 404 for a thread that HAS content still shows the error surface.
    expect(branch).toContain('setThreadRestoreError("not-found")');
  });

  it("no longer sets an unconditional restore error on 404", () => {
    expect(source).not.toContain(
      'setThreadRestoreError(res.status === 404 ? "not-found" : "unavailable")',
    );
  });
});
