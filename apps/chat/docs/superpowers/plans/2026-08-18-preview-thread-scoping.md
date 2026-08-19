# Preview Thread Scoping & Thread Timestamp Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scope artifact previews to the conversation that generated them (fresh conversations start clean; Artifacts-page previews render on that page), and stop every page load from stamping all chat threads as "now".

**Architecture:** The `artifact-preview` app-state value gains a `threadId: string | null` field: the action fills it from `ctx.threadId` (populated only for agent tool calls); UI opens from the Artifacts page store `null`. The chat-side panel renders only when `threadId` matches the active conversation (tracked via the framework's `agent-chat:open-thread` window event + localStorage `agent-chat-active-thread:chat` + route param); the Artifacts page mounts its own panel that renders only `threadId === null` previews. The timestamp bug is framework behavior (contentless run finalization "just bumps timestamp", amplified by stale localStorage tabs and zombie runs from dev restarts): fix by hygiene + verification, patching the framework's one line only if the bump recurs on a clean state.

**Tech Stack:** existing feature files (`actions/preview-artifact.ts`, `app/components/preview/*`, `app/routes/artifacts.tsx`), vitest (both configs), pnpm patch (conditional).

## Global Constraints

- Preview state value shape becomes `{ resourceId: string, path: string, threadId: string | null }` — every consumer in this plan uses exactly this shape.
- Scoping rule: chat panel shows a preview only when `preview.threadId === activeThreadId`; Artifacts-page panel only when `preview.threadId === null`. Old-shape values (no `threadId` key) are treated as invalid and hidden.
- Sandbox invariant unchanged: iframe `sandbox="allow-scripts"`, never `allow-same-origin`.
- App-owned code only, except the (conditional) one-line extension of `patches/@agent-native__core.patch` in Task 3 — no other framework edits.
- Commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Thread-scoped preview state

**Files:**
- Modify: `actions/preview-artifact.ts`
- Modify: `app/components/preview/use-artifact-preview.ts`
- Modify: `app/components/preview/ArtifactPreviewPanel.tsx`
- Modify: `app/routes/artifacts.tsx`
- Test: `tests/preview-artifact-action.test.ts`, `tests/artifact-preview-panel.test.tsx`

**Interfaces:**
- Consumes: `ctx.threadId` from the action context (string when the agent calls the action inside a run; undefined from UI/HTTP callers).
- Produces: `ArtifactPreviewState = { resourceId: string; path: string; threadId: string | null }`; `useArtifactPreview()` additionally returns `activeThreadId: string | null`; `ArtifactPreviewPanel` takes a required prop `scope: "chat" | "page"`.

- [ ] **Step 1: Extend the action test (failing first)**

Add to `tests/preview-artifact-action.test.ts` (adapt imports already present):

```ts
  it("stores the calling agent's threadId in the preview state", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/threaded.html",
        "<html><body>t</body></html>",
        "text/html",
      );
      await previewArtifact.run({ resourceId: resource.id }, {
        caller: "tool",
        threadId: "thread-123",
      } as never);
      const state = (await readAppState("artifact-preview")) as {
        threadId: string | null;
      };
      expect(state.threadId).toBe("thread-123");
    });
  });

  it("stores threadId null for non-agent callers", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/manual.html",
        "<html><body>m</body></html>",
        "text/html",
      );
      await previewArtifact.run({ resourceId: resource.id });
      const state = (await readAppState("artifact-preview")) as {
        threadId: string | null;
      };
      expect(state.threadId).toBeNull();
    });
  });
```

If the existing tests call `previewArtifact.run(args)` with one argument, keep that pattern for the second test. If the ctx second argument is typed differently, match `defineAction`'s run signature (check with `grep -n "run" node_modules/@agent-native/core/dist/action.d.ts | head`) — the goal is: ctx with `threadId` → stored; no ctx/threadId → `null`.

- [ ] **Step 2: Run to verify the new tests fail**

Run: `pnpm vitest --run --config vitest.server.config.ts tests/preview-artifact-action.test.ts`
Expected: 2 new tests FAIL (threadId undefined), existing 3 PASS.

- [ ] **Step 3: Update the action**

In `actions/preview-artifact.ts`, change the run signature to accept ctx and include threadId in the write:

```ts
  run: async ({ resourceId }, ctx) => {
    const resource = await resourceGet(resourceId);
    if (!resource) {
      throw new Error(`Artifact not found: ${resourceId}`);
    }
    if (resource.mimeType !== "text/html") {
      throw new Error(
        `Only HTML artifacts can be previewed (got ${resource.mimeType}).`,
      );
    }
    await writeAppState("artifact-preview", {
      resourceId: resource.id,
      path: resource.path,
      // Agent tool calls carry the conversation id; UI/HTTP callers don't.
      // The chat panel scopes previews to this conversation; null renders
      // on the Artifacts page instead.
      threadId: ctx?.threadId ?? null,
    });
    return { opened: true as const, path: resource.path };
  },
```

- [ ] **Step 4: Verify action tests pass**

Run: `pnpm vitest --run --config vitest.server.config.ts tests/preview-artifact-action.test.ts`
Expected: all PASS (5).

- [ ] **Step 5: Extend the hook with active-thread tracking and threadId-aware open**

Replace `app/components/preview/use-artifact-preview.ts` content with:

```ts
import {
  readClientAppState,
  setClientAppState,
} from "@agent-native/core/client/application-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { TAB_ID } from "@/lib/tab-id";

export interface ArtifactPreviewState {
  resourceId: string;
  path: string;
  /** Conversation the preview belongs to; null = Artifacts-page preview. */
  threadId: string | null;
}

const QUERY_KEY = ["app-state", "artifact-preview"];
const ACTIVE_THREAD_STORAGE_KEY = "agent-chat-active-thread:chat";

function readStoredActiveThread(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * The active conversation id: the /chat/:threadId route param when present,
 * otherwise the framework's persisted active-thread key, refreshed when the
 * framework announces a thread switch via the agent-chat:open-thread event.
 */
export function useActiveChatThreadId(): string | null {
  const { threadId: routeThreadId } = useParams();
  const [storedId, setStoredId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readStoredActiveThread(),
  );

  useEffect(() => {
    const refresh = () => setStoredId(readStoredActiveThread());
    window.addEventListener("agent-chat:open-thread", refresh);
    window.addEventListener("storage", refresh);
    // Poll as a fallback: the framework writes the key without an event in
    // some flows (e.g. New Chat creating an optimistic thread).
    const timer = window.setInterval(refresh, 1500);
    return () => {
      window.removeEventListener("agent-chat:open-thread", refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, []);

  return routeThreadId ?? storedId;
}

/**
 * The `artifact-preview` app-state key, kept live by useDbSync (app-state
 * sync events invalidate the ["app-state"] query prefix).
 */
export function useArtifactPreview() {
  const queryClient = useQueryClient();
  const activeThreadId = useActiveChatThreadId();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      readClientAppState<ArtifactPreviewState | null>("artifact-preview"),
  });

  async function open(state: ArtifactPreviewState) {
    await setClientAppState("artifact-preview", state, {
      requestSource: TAB_ID,
    });
    queryClient.setQueryData(QUERY_KEY, state);
  }

  async function close() {
    await setClientAppState("artifact-preview", null, {
      requestSource: TAB_ID,
    });
    queryClient.setQueryData(QUERY_KEY, null);
  }

  return { preview: query.data ?? null, activeThreadId, open, close };
}
```

(If `readClientAppState` rejects the generic in this version, call untyped and cast — match whatever the current file does.)

- [ ] **Step 6: Scope the panel by a required prop**

In `app/components/preview/ArtifactPreviewPanel.tsx`:
- Change the signature to `export function ArtifactPreviewPanel({ scope }: { scope: "chat" | "page" })`.
- Destructure `activeThreadId` from `useArtifactPreview()`.
- Replace the guard with:

```ts
  if (!preview?.resourceId || !preview?.path) return null;
  if (!("threadId" in preview)) return null; // pre-scoping legacy value
  if (scope === "chat" && preview.threadId !== activeThreadId) return null;
  if (scope === "page" && preview.threadId !== null) return null;
```

(`activeThreadId` may be null on a brand-new conversation; a chat-scoped preview with a string threadId then correctly hides.)
- When the switcher `open()`s another artifact, preserve the current scoping: pass `threadId: preview.threadId`.

- [ ] **Step 7: Update the two mount points**

- `app/components/layout/Layout.tsx`: `<ArtifactPreviewPanel scope="chat" />`.
- `app/routes/artifacts.tsx`: re-add `<ArtifactPreviewPanel scope="page" />` next to the list (inside the page container, after the `</ul>`); change `previewArtifact` to `await open({ resourceId, path, threadId: null })` and REMOVE the `navigate("/")` call and its import if now unused. Keep the try/catch + toast.

- [ ] **Step 8: Update and extend the panel tests (failing first where behavior is new)**

In `tests/artifact-preview-panel.test.tsx`: render `<ArtifactPreviewPanel scope="chat" />` in the existing tests and set the mocked state to include `threadId: null`... note that with scope="chat" and `threadId: null`, the panel hides unless `activeThreadId` is also null — so for the existing render tests, mock the preview state as `{ resourceId: "res-1", path: "artifacts/test.html", threadId: "t-1" }` and make the active thread also `t-1` by mocking `react-router`'s `useParams`:

```ts
vi.mock("react-router", () => ({ useParams: () => ({ threadId: "t-1" }) }));
```

Add three new cases:

```ts
  it("hides a chat-scoped preview when another conversation is active", async () => {
    // preview.threadId "t-2" vs active "t-1"
    // assert container.firstChild is null
  });

  it("hides page-scoped previews in chat scope", async () => {
    // scope="chat", preview.threadId null, active "t-1" → hidden
  });

  it("shows page-scoped previews in page scope", async () => {
    // scope="page", preview.threadId null → iframe renders
  });
```

Write these as real tests (mock `readClientAppState` per-case via a mutable mock, as the malformed-state test already does). Run: `pnpm vitest --run --config vitest.server.config.ts tests/artifact-preview-panel.test.tsx` until all pass.

- [ ] **Step 9: Full verification and commit**

Run: `pnpm typecheck && pnpm test` — clean.

```bash
git add actions/preview-artifact.ts app/components/preview app/components/layout/Layout.tsx app/routes/artifacts.tsx tests/
git commit -m "fix: scope artifact previews to their conversation"
```

---

### Task 2: State hygiene + timestamp reproduction check

**Files:** none committed (browser localStorage + verification only)

**Interfaces:** consumes the running app on port 8080; produces a verdict for Task 3.

- [ ] **Step 1: Restart the dev server** (pick up Task 1) and wait for HTTP 200.

- [ ] **Step 2: Clear stale client state** via the browser (controller does this in the browser console/tools):

```js
localStorage.removeItem("agent-chat-open-tabs:chat");
localStorage.removeItem("agent-chat-active-thread:chat");
localStorage.removeItem("agent-chat-active-thread:chat:seen");
```

Then reload twice (first load lets the framework finalize any remaining zombie runs).

- [ ] **Step 3: Reproduction check**

```bash
sqlite3 data/app.db "SELECT MAX(updated_at) FROM chat_threads"
```

Record the value; reload the app twice more; re-run the query. **Verdict:** unchanged → framework bump was zombie-run finalization only, no patch needed (Task 3 skipped, note in ledger). Changed → Task 3 required.

---

### Task 3 (conditional — only if Task 2's verdict is "changed"): patch the contentless-run timestamp bump

**Files:**
- Modify: `patches/@agent-native__core.patch` (via `pnpm patch @agent-native/core` + `pnpm patch-commit`)

The framework's run finalizer (`dist/server/agent-chat-plugin.js`, search for "No content produced — just bump timestamp") calls `updateThreadData(threadId, thread.threadData, thread.title, thread.preview, thread.messageCount)` purely to bump `updated_at`, which reorders the sidebar and marks threads "now" on every reap. Patch: replace that call with a no-op (`return;` — everything it writes is already the stored value; its only effect is the timestamp). Steps: `pnpm patch @agent-native/core` (note: the patch dir starts from the ALREADY-PATCHED package, so the existing lookaround fix is present — do not remove it), edit, `pnpm patch-commit`, restart dev, re-run Task 2 Step 3's check (must be unchanged now), run `pnpm test` + `pnpm typecheck`, commit patch + lockfile as `fix: stop contentless run finalization from bumping thread timestamps`.

---

### Task 4: End-to-end verification (controller-driven, browser)

1. Clean state from Task 2. In a conversation, ask the agent to show an artifact → panel opens in THAT conversation.
2. Click "New Chat" → panel disappears; the new conversation is pristine.
3. Navigate back to the generating conversation (sidebar) → panel reappears with the same artifact.
4. `/artifacts` → Preview renders beside the list on the page itself, no navigation; switching to Chat hides it.
5. Sidebar timestamps: older conversations show minutes/hours, not "now", after several reloads.
6. `pnpm typecheck && pnpm test` green. Commit anything outstanding.

## Verification (definition of done)

All six Task 4 checks pass; new tests lock the scoping rules; no framework files modified outside the managed patch.

## Addendum (post-implementation)

Task 3 shipped two patch hunks, not one: besides the contentless-run finalizer, the client PUT-save path proved to be the actual cause of view-bumps and received a strict no-op skip guard. Both verified (sqlite byte-identical timestamps across views) and approved in the final whole-branch review. Side effect worth knowing: scope-only retags no longer reorder the sidebar either (intended).
