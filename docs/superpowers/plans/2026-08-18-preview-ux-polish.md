# Preview UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the artifact preview to AI-chat-standard UX (Gemini reference): a persistent in-conversation CTA that can reopen a closed preview, a redesigned panel with Share and Export actions and proper margins, and a full-height preview on the Artifacts page instead of the cramped under-list box.

**Architecture:** Three moves. (1) Decouple "a preview exists" from "the panel is open": closing collapses to a floating reopen chip instead of clearing state, so the preview is always recoverable. (2) The `preview-artifact` action declares `chatUI: { renderer: "core.workspace-file" }` and returns the `WorkspaceFileResult` shape, so the framework renders its native file card in the transcript for every preview — the durable in-conversation CTA. (3) The panel becomes a rounded, margined card (Gemini-style) with a header carrying title/switcher/Share/Export/close; the Artifacts page becomes a two-column split with the panel at full height.

**Tech Stack:** existing preview files; `ShareButton` from `@agent-native/core/client` (verified props: `resourceType`, `resourceId`, `resourceTitle`, `onOpenChange`); `ACTION_CHAT_UI_WORKSPACE_FILE_RENDERER` from `@agent-native/core/action-ui`; `resourceDownloadUrl`; vitest.

## Global Constraints

- Preview state value on the server stays `{ resourceId, path, threadId: string | null }` — unchanged shape, unchanged scoping rules (chat panel: real active thread AND match; page panel: `threadId === null`; legacy hidden).
- Collapsed/expanded is CLIENT-LOCAL (localStorage), never written to server app-state.
- Sandbox invariant unchanged: iframe `sandbox="allow-scripts"`, never `allow-same-origin`. The iframe gets `pointer-events: none` while the share popover is open (via `ShareButton.onOpenChange`) — that is a style change only, not a sandbox change.
- App-owned code only. English labels. Commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Collapse-to-chip instead of close

**Files:**
- Modify: `app/components/preview/use-artifact-preview.ts`
- Modify: `app/components/preview/ArtifactPreviewPanel.tsx`
- Test: `tests/artifact-preview-panel.test.tsx`

**Interfaces:**
- Produces: `useArtifactPreview()` returns `{ preview, activeThreadId, open, collapsed, collapse, expand }`. `open()` also un-collapses. The old `close` is REMOVED (panel × now collapses). `ArtifactPreviewPanel` renders either the full panel, or — when a scope-matching preview exists but `collapsed` — a floating chip button labeled with the artifact file name that calls `expand()`.

- [ ] **Step 1: Write failing tests** — add to `tests/artifact-preview-panel.test.tsx` (follow the file's existing mock pattern; mock localStorage via the real jsdom localStorage):

```ts
  it("collapses to a reopen chip instead of disappearing", async () => {
    // matching chat-scoped preview; localStorage "artifact-preview-collapsed" = "1"
    window.localStorage.setItem("artifact-preview-collapsed", "1");
    // render scope="chat" with matching thread; assert: no iframe, but a
    // button with accessible name matching /test\.html/ exists
  });

  it("expands from the chip on click", async () => {
    window.localStorage.setItem("artifact-preview-collapsed", "1");
    // render, click the chip button, then assert the iframe appears and
    // localStorage flag is cleared
  });
```

Write them as real tests with real assertions; run to see them fail.

- [ ] **Step 2: Implement the hook change** — in `use-artifact-preview.ts` add:

```ts
const COLLAPSED_KEY = "artifact-preview-collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
```

Inside `useArtifactPreview`: `const [collapsed, setCollapsed] = useState(() => typeof window === "undefined" ? false : readCollapsed());` plus:

```ts
  function collapse() {
    try { window.localStorage.setItem(COLLAPSED_KEY, "1"); } catch {}
    setCollapsed(true);
  }
  function expand() {
    try { window.localStorage.removeItem(COLLAPSED_KEY); } catch {}
    setCollapsed(false);
  }
```

`open()` calls `expand()` after writing state. Delete `close()` and the server-null write (the preview reference now persists; a preview is replaced only by opening another). Return `{ preview, activeThreadId, open, collapsed, collapse, expand }`.

- [ ] **Step 3: Panel renders chip when collapsed** — in `ArtifactPreviewPanel.tsx`, after the existing scope guards pass, add before the full render:

```tsx
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={expand}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-border bg-card px-2 py-3 text-xs font-medium shadow-md hover:bg-accent"
        aria-label={`Reopen preview: ${preview.path.replace(/^artifacts\//, "")}`}
      >
        <span className="[writing-mode:vertical-rl]">
          {preview.path.replace(/^artifacts\//, "")}
        </span>
      </button>
    );
  }
```

Replace the header ×'s `onClick={() => void close()}` with `onClick={collapse}`. Update any other `close` references (artifacts page does not use `close`).

- [ ] **Step 4: Run panel tests (all green), full `pnpm test` + `pnpm typecheck`, commit** — `feat: collapse preview to reopen chip instead of closing`.

---

### Task 2: Gemini-style panel chrome, margins, Share and Export

**Files:**
- Modify: `app/components/preview/ArtifactPreviewPanel.tsx`
- Modify: `app/components/layout/Layout.tsx` (chat branch spacing only)
- Test: `tests/artifact-preview-panel.test.tsx`

**Interfaces:**
- Consumes: `ShareButton` from `@agent-native/core/client` (`resourceType`, `resourceId`, `resourceTitle`, `onOpenChange`); `resourceDownloadUrl` (already imported).

- [ ] **Step 1: Verify the shareable resourceType for file resources.** Run:
`grep -rn "registerShareable\|resourceType" node_modules/@agent-native/core/dist/sharing/*.js | head -20` and `grep -rn "registerShareable" node_modules/@agent-native/core/dist/resources/*.js node_modules/@agent-native/core/dist/server/*.js | head`.
Find the type string registered for the resources table (expected something like `"resource"` or `"file"`). If file resources are NOT registered shareable, do not fake it: render the Share button but have it open the framework `ShareDialog` only if a type exists; otherwise SKIP Share (leave Export + a code comment + report the finding as a concern — the controller will decide follow-up).

- [ ] **Step 2: Write failing tests** (extend the existing "renders the artifact" happy-path test): assert the header contains a link with accessible name /export/i whose `href` contains the resource id and has a `download` attribute; assert a button /share/i exists (skip this assertion if Step 1 found sharing unavailable — note it in the fix report).

- [ ] **Step 3: Redesign the panel container and header.** Replace the `<aside>` wrapper and header with:

```tsx
    <aside className="my-3 mr-3 flex w-[45%] min-w-[360px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        {/* switcher or filename — keep existing logic, but wrap the title in
            a min-w-0 flex-1 container so action buttons never overflow */}
        ...existing switcher/title block...
        <ShareButton
          resourceType={SHARE_RESOURCE_TYPE}
          resourceId={preview.resourceId}
          resourceTitle={preview.path.replace(/^artifacts\//, "")}
          onOpenChange={setShareOpen}
        />
        <a
          href={resourceDownloadUrl(preview.resourceId)}
          download
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <IconDownload className="size-3.5" /> Export
        </a>
        <Button type="button" variant="ghost" size="icon" aria-label="Collapse preview" onClick={collapse}>
          <IconX className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1">
        ...existing loading/error/too-large/iframe block, with the iframe gaining
        className={cn("h-full w-full border-0 bg-white", shareOpen && "pointer-events-none")}...
      </div>
    </aside>
```

`const [shareOpen, setShareOpen] = useState(false);` — the pointer-events guard is what ShareButton's own docs recommend next to iframes. Import `cn` from `@/lib/utils`, `ShareButton` from `@agent-native/core/client`.

- [ ] **Step 4: Chat-side breathing room.** In `Layout.tsx`'s chat branch the panel's own `my-3 mr-3` margins (Step 3) already separate it from the viewport edge; add `gap-1` to the `agent-layout-main-surface` flex container so the transcript column and panel card don't touch. Do not restyle `contentFrame` internals (framework-owned).

- [ ] **Step 5: Tests green (panel file), full suite + typecheck, visual sanity via `pnpm dev` screenshot if available, commit** — `feat: preview panel chrome with share and export`.

---

### Task 3: In-transcript file-card CTA from the action

**Files:**
- Modify: `actions/preview-artifact.ts`
- Modify: `server/plugins/agent-chat.ts` (one prompt sentence)
- Test: `tests/preview-artifact-action.test.ts`

**Interfaces:**
- Produces: `preview-artifact` result becomes `{ opened: true, path, file: { resourceId, path, name, contentType, sizeBytes } }` and the action declares `chatUI: { renderer: ACTION_CHAT_UI_WORKSPACE_FILE_RENDERER, title: "Artifact preview" }` — the framework transcript then renders its native file card (name, size, Download) at the exact point in the conversation where the preview was opened. The card persists in history, giving the durable in-conversation CTA.

- [ ] **Step 1: Failing test** — extend the happy-path action test:

```ts
      expect(result).toMatchObject({
        opened: true,
        path: "artifacts/test-page.html",
        file: {
          resourceId: resource.id,
          path: "artifacts/test-page.html",
          name: "test-page.html",
          contentType: "text/html",
        },
      });
      expect(typeof (result as { file: { sizeBytes: number } }).file.sizeBytes).toBe("number");
```

- [ ] **Step 2: Implement.** In `actions/preview-artifact.ts`:

```ts
import { ACTION_CHAT_UI_WORKSPACE_FILE_RENDERER } from "@agent-native/core/action-ui";
```

Add to the `defineAction` options: `chatUI: { renderer: ACTION_CHAT_UI_WORKSPACE_FILE_RENDERER, title: "Artifact preview" },` and extend the return:

```ts
    return {
      opened: true as const,
      path: resource.path,
      file: {
        resourceId: resource.id,
        path: resource.path,
        name: resource.path.split("/").pop() ?? resource.path,
        contentType: resource.mimeType,
        sizeBytes: resource.size,
      },
    };
```

(Verify `resource.size` is the byte count via the `Resource` type in `node_modules/@agent-native/core/dist/client/resources/use-resources.d.ts` — the store's Resource has `size: number`. If the server store type names it differently, adapt.)

- [ ] **Step 3: Prompt tweak.** In `server/plugins/agent-chat.ts`, extend the artifact paragraph's last sentence to: "Mention that the preview is open — the file card shown with your reply is how the user reopens it later — and never paste the HTML source into your reply."

- [ ] **Step 4: Tests green, full suite + typecheck, restart dev server, commit** — `feat: transcript file card for artifact previews`.

---

### Task 4: Artifacts page full-height split

**Files:**
- Modify: `app/routes/artifacts.tsx`

- [ ] **Step 1: Restructure the layout.** Replace the page's outer container:

```tsx
  return (
    <div className="flex h-full min-h-0">
      <div className="w-[400px] shrink-0 overflow-y-auto p-6">
        <h1 className="mb-1 text-xl font-semibold">Artifacts</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          HTML artifacts generated by the agent.
        </p>
        {/* existing loading / empty / <ul> list block unchanged */}
      </div>
      <div className="flex min-w-0 flex-1">
        <ArtifactPreviewPanel scope="page" />
      </div>
    </div>
  );
```

The panel's own `my-3 mr-3 rounded-xl` card (Task 2) now fills the right column at full height. Note the panel's `w-[45%]` width: change the panel to accept the width from its container instead — in `ArtifactPreviewPanel.tsx` replace `w-[45%] min-w-[360px] shrink-0` with `w-full min-w-0 flex-1` ONLY when `scope === "page"`; keep the chat sizing for `scope="chat"` (conditional class via `cn(scope === "chat" ? "w-[45%] min-w-[360px] shrink-0" : "min-w-0 flex-1")`).
Update the page description copy since preview no longer "opens beside the chat".

- [ ] **Step 2: Verify `h-full` chain.** The route renders inside `<main className="agent-native-app-main min-w-0 flex-1 overflow-y-auto">`; if `h-full` doesn't propagate, use `h-[calc(100vh-theme(spacing.12))]`-style only as a last resort — prefer `min-h-0 flex` chains. Check visually with the dev server.

- [ ] **Step 3: typecheck + tests + commit** — `feat: full-height preview split on artifacts page`.

---

### Task 5: End-to-end verification (controller-driven, browser)

1. In a conversation, ask the agent for a new artifact → transcript shows the file card (name/size/Download) AND the panel opens with the new chrome (rounded card, margins, Share, Export, ×).
2. Click × → panel collapses to the right-edge chip; the file card remains in the transcript. Click the chip → panel reopens. Reload → chip persists (collapsed state remembered).
3. Export downloads the .html; Share opens the framework share popover (do not publish anything).
4. New Chat → no panel, no chip (scoping intact). Return to the conversation → chip/panel back.
5. `/artifacts` → full-height split; Preview fills the right column; no under-list mini box.
6. Screenshots to the user of: chat with panel open, collapsed chip, artifacts split.
7. `pnpm typecheck && pnpm test` green.

## Verification (definition of done)

All Task 5 checks pass; the CTA is durable (card in transcript + chip when collapsed); sandbox test still locks `allow-scripts`.
