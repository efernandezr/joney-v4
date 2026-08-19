# Artifact Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A collapsible sandboxed preview panel beside the chat that renders HTML artifacts, opened by a shared `preview-artifact` action callable by both the agent and the UI, plus an `/artifacts` browser page.

**Architecture:** One app action writes an `artifact-preview` application-state key (`{resourceId, path} | null`); the framework's SSE sync invalidates react-query key `["app-state"]`, so an app-owned panel subscribed to that key opens/closes reactively. Artifact HTML renders via `<iframe sandbox="allow-scripts" srcDoc={content}>` (never `allow-same-origin`). No framework code ejected, no new server routes.

**Tech Stack:** @agent-native/core (defineAction, application-state, client resource hooks), React 19, @tanstack/react-query, vitest (+ jsdom & @testing-library/react added as devDeps), zod.

## Global Constraints

- Sandbox attribute must be exactly `allow-scripts` — adding `allow-same-origin` is a security regression (spec: "LLM-generated HTML must run in an opaque origin").
- UI labels English-only this milestone; the sidebar label goes in `app/i18n/en-US.ts` only.
- App-owned code only: `actions/`, `app/components/preview/`, `app/routes/artifacts.tsx`, one prompt line in `server/plugins/agent-chat.ts`, small edits to `Layout.tsx`/`Sidebar.tsx`. Do not modify `node_modules` or framework-owned transcript components.
- Run all commands from the repo root. `pnpm dev` / `pnpm typecheck` regenerate `.generated/actions-registry.js` when actions change.
- All commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: `preview-artifact` action

**Files:**
- Create: `actions/preview-artifact.ts`
- Test: `tests/preview-artifact-action.test.ts`

**Interfaces:**
- Consumes: `resourceGet`, `resourcePut`, `WORKSPACE_OWNER` from `@agent-native/core/resources/store`; `writeAppState`, `readAppState` from `@agent-native/core/application-state`; `defineAction` from `@agent-native/core/action`.
- Produces: action `preview-artifact` with schema `{ resourceId: string }`, run result `{ opened: true, path: string }`; app-state key `"artifact-preview"` holding `{ resourceId: string, path: string }`. Tasks 2-4 rely on the key name and value shape exactly as written here.

- [ ] **Step 1: Write the failing test**

```ts
// tests/preview-artifact-action.test.ts
import { readAppState, writeAppState } from "@agent-native/core/application-state";
import { resourcePut, WORKSPACE_OWNER } from "@agent-native/core/resources/store";
import { beforeEach, describe, expect, it } from "vitest";

import previewArtifact from "../actions/preview-artifact";

describe("preview-artifact action", () => {
  beforeEach(async () => {
    await writeAppState("artifact-preview", null);
  });

  it("writes the artifact-preview app state and returns the path", async () => {
    const resource = await resourcePut(
      WORKSPACE_OWNER,
      "artifacts/test-page.html",
      "<html><body>hi</body></html>",
      "text/html",
    );

    const result = await previewArtifact.run({ resourceId: resource.id });

    expect(result).toEqual({ opened: true, path: "artifacts/test-page.html" });
    const state = await readAppState<{ resourceId: string; path: string }>(
      "artifact-preview",
    );
    expect(state).toMatchObject({
      resourceId: resource.id,
      path: "artifacts/test-page.html",
    });
  });

  it("rejects a missing resource", async () => {
    await expect(
      previewArtifact.run({ resourceId: "does-not-exist" }),
    ).rejects.toThrow(/not found/i);
  });

  it("rejects non-HTML resources", async () => {
    const resource = await resourcePut(
      WORKSPACE_OWNER,
      "artifacts/notes.md",
      "# notes",
      "text/markdown",
    );
    await expect(
      previewArtifact.run({ resourceId: resource.id }),
    ).rejects.toThrow(/Only HTML artifacts/i);
  });
});
```

If `readAppState` has no generic parameter in this version, drop the `<...>` and cast: `(await readAppState("artifact-preview")) as { resourceId: string; path: string }`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/preview-artifact-action.test.ts`
Expected: FAIL — cannot resolve `../actions/preview-artifact`.

- [ ] **Step 3: Write the action**

```ts
// actions/preview-artifact.ts
/**
 * Open an HTML artifact in the user's preview panel.
 *
 * Writes the `artifact-preview` application-state key; the UI panel
 * subscribes to it and renders the artifact in a sandboxed iframe.
 */
import { defineAction } from "@agent-native/core/action";
import { writeAppState } from "@agent-native/core/application-state";
import { resourceGet } from "@agent-native/core/resources/store";
import { z } from "zod";

export default defineAction({
  description:
    "Open an HTML artifact (a workspace resource such as artifacts/page.html) in the user's side preview panel so they can see and interact with it. Call this right after creating or updating an HTML artifact.",
  schema: z.object({
    resourceId: z.string().describe("ID of the text/html resource to preview"),
  }),
  http: false,
  run: async ({ resourceId }) => {
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
    });
    return { opened: true as const, path: resource.path };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/preview-artifact-action.test.ts`
Expected: PASS (3 tests). If `resourceGet`/`resourcePut` complain about missing request context in tests, wrap test bodies with `runWithRequestContext({}, () => ...)` from `@agent-native/core/server` — check its exact export with `grep -n "runWithRequestContext" node_modules/@agent-native/core/dist/server/index.d.ts` first.

- [ ] **Step 5: Typecheck and commit**

Run: `pnpm typecheck` (also regenerates the actions registry). Expected: clean.

```bash
git add actions/preview-artifact.ts tests/preview-artifact-action.test.ts .generated 2>/dev/null; git add actions/preview-artifact.ts tests/preview-artifact-action.test.ts
git commit -m "feat: preview-artifact action writes artifact-preview app state"
```

(If `.generated/` is gitignored, the first `git add` silently no-ops — that is fine.)

---

### Task 2: Preview hook, panel component, layout integration

**Files:**
- Create: `app/components/preview/use-artifact-preview.ts`
- Create: `app/components/preview/ArtifactPreviewPanel.tsx`
- Modify: `app/components/layout/Layout.tsx` (chat-route branch, around lines 161-164)
- Test: `tests/artifact-preview-panel.test.tsx`

**Interfaces:**
- Consumes: app-state key `"artifact-preview"` = `{ resourceId, path } | null` (Task 1); `readClientAppState`/`setClientAppState` from `@agent-native/core/client/application-state`; `useResource`, `useResources`, `resourceDownloadUrl` from `@agent-native/core/client/resources`; `TAB_ID` from `@/lib/tab-id`.
- Produces: `useArtifactPreview(): { preview: ArtifactPreviewState | null, open(state): Promise<void>, close(): Promise<void> }` and `<ArtifactPreviewPanel />` (no props). Task 3 calls `useArtifactPreview().open`.

- [ ] **Step 1: Add test devDependencies**

```bash
pnpm add -D @testing-library/react jsdom
```

- [ ] **Step 2: Write the failing component test**

```tsx
// tests/artifact-preview-panel.test.tsx
// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@agent-native/core/client/application-state", () => ({
  readClientAppState: vi.fn(async () => ({
    resourceId: "res-1",
    path: "artifacts/test.html",
  })),
  setClientAppState: vi.fn(async () => null),
}));

const useResourceMock = vi.fn();
vi.mock("@agent-native/core/client/resources", () => ({
  useResource: (id: string | null) => useResourceMock(id),
  useResources: () => ({ data: [] }),
  resourceDownloadUrl: (id: string) => `/download/${id}`,
}));

import { ArtifactPreviewPanel } from "../app/components/preview/ArtifactPreviewPanel";

function renderPanel() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ArtifactPreviewPanel />
    </QueryClientProvider>,
  );
}

describe("ArtifactPreviewPanel", () => {
  it("renders the artifact in a sandboxed iframe without allow-same-origin", async () => {
    useResourceMock.mockReturnValue({
      data: {
        id: "res-1",
        path: "artifacts/test.html",
        content: "<html><body>hello</body></html>",
        mimeType: "text/html",
        size: 30,
      },
      isLoading: false,
      isError: false,
    });
    renderPanel();
    const iframe = (await screen.findByTitle(
      "artifacts/test.html",
    )) as HTMLIFrameElement;
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
    expect(iframe.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(iframe.getAttribute("srcdoc")).toContain("hello");
  });

  it("shows an error state with retry when the resource fails to load", async () => {
    const refetch = vi.fn();
    useResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    renderPanel();
    expect(await screen.findByText(/couldn't load/i)).toBeTruthy();
    (await screen.findByRole("button", { name: /retry/i })).click();
    expect(refetch).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test tests/artifact-preview-panel.test.tsx`
Expected: FAIL — cannot resolve `../app/components/preview/ArtifactPreviewPanel`.

- [ ] **Step 4: Write the hook**

```ts
// app/components/preview/use-artifact-preview.ts
import {
  readClientAppState,
  setClientAppState,
} from "@agent-native/core/client/application-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TAB_ID } from "@/lib/tab-id";

export interface ArtifactPreviewState {
  resourceId: string;
  path: string;
}

const QUERY_KEY = ["app-state", "artifact-preview"];

/**
 * The `artifact-preview` app-state key, kept live by useDbSync: any app-state
 * sync event invalidates the ["app-state"] query key prefix, so agent writes
 * (via the preview-artifact action) land here without polling.
 */
export function useArtifactPreview() {
  const queryClient = useQueryClient();
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

  return { preview: query.data ?? null, open, close };
}
```

If `readClientAppState` rejects a generic parameter, call it untyped and cast the result.

- [ ] **Step 5: Write the panel**

```tsx
// app/components/preview/ArtifactPreviewPanel.tsx
import {
  resourceDownloadUrl,
  useResource,
  useResources,
} from "@agent-native/core/client/resources";
import { IconDownload, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

import { useArtifactPreview } from "./use-artifact-preview";

const MAX_INLINE_BYTES = 1024 * 1024;

export function ArtifactPreviewPanel() {
  const { preview, open, close } = useArtifactPreview();
  const resource = useResource(preview?.resourceId ?? null);
  const artifacts = useResources("workspace");

  if (!preview) return null;

  const htmlArtifacts = (artifacts.data ?? []).filter(
    (r) => r.path?.startsWith("artifacts/") && r.mimeType === "text/html",
  );

  return (
    <aside className="flex w-[45%] min-w-[320px] shrink-0 flex-col border-l border-border bg-card">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        {htmlArtifacts.length > 1 ? (
          <select
            aria-label="Artifact"
            className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={preview.resourceId}
            onChange={(event) => {
              const next = htmlArtifacts.find(
                (r) => r.id === event.target.value,
              );
              if (next) void open({ resourceId: next.id, path: next.path });
            }}
          >
            {htmlArtifacts.map((r) => (
              <option key={r.id} value={r.id}>
                {r.path.replace(/^artifacts\//, "")}
              </option>
            ))}
          </select>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {preview.path.replace(/^artifacts\//, "")}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close preview"
          onClick={() => void close()}
        >
          <IconX className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1">
        {resource.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-b-2 border-foreground" />
          </div>
        ) : resource.isError || !resource.data ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn't load this artifact.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void resource.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : resource.data.size > MAX_INLINE_BYTES ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This artifact is too large to preview inline.
            </p>
            <a
              href={resourceDownloadUrl(resource.data.id)}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <IconDownload className="size-3.5" /> Download
            </a>
          </div>
        ) : (
          <iframe
            // Security invariant: sandbox stays exactly "allow-scripts".
            // No allow-same-origin — generated HTML must not reach app
            // cookies, storage, or APIs. Locked by the component test.
            sandbox="allow-scripts"
            srcDoc={resource.data.content}
            title={preview.path}
            className="h-full w-full border-0 bg-white"
          />
        )}
      </div>
    </aside>
  );
}
```

Before finishing, verify `ResourceMeta` (returned by `useResources`) exposes `path`, `mimeType`, `id`: `sed -n '26,45p' node_modules/@agent-native/core/dist/client/resources/use-resources.d.ts`. If field names differ, adjust the filter accordingly.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test tests/artifact-preview-panel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Mount the panel in Layout**

In `app/components/layout/Layout.tsx`, add the import and change the chat-route branch:

```tsx
import { ArtifactPreviewPanel } from "@/components/preview/ArtifactPreviewPanel";
```

```tsx
{isChatRoute ? (
  <div className="agent-layout-main-surface flex min-w-0 flex-1 overflow-hidden">
    {contentFrame}
    <ArtifactPreviewPanel />
  </div>
) : (
```

- [ ] **Step 8: Verify typecheck and full test suite**

Run: `pnpm typecheck && pnpm test`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add app/components/preview tests/artifact-preview-panel.test.tsx app/components/layout/Layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: sandboxed artifact preview panel beside chat"
```

---

### Task 3: Artifacts browser page and sidebar nav

**Files:**
- Create: `app/routes/artifacts.tsx`
- Modify: `app/components/layout/Sidebar.tsx` (navItems array, ~line 35)
- Modify: `app/i18n/en-US.ts` (navigation block, ~line 42)

**Interfaces:**
- Consumes: `useArtifactPreview().open({ resourceId, path })` from Task 2; `useResources` from `@agent-native/core/client/resources`.
- Produces: route `/artifacts`; sidebar nav item labeled via `navigation.artifacts`.

- [ ] **Step 1: Create the route**

```tsx
// app/routes/artifacts.tsx
import { useResources } from "@agent-native/core/client/resources";
import { useNavigate } from "react-router";

import { ArtifactPreviewPanel } from "@/components/preview/ArtifactPreviewPanel";
import { useArtifactPreview } from "@/components/preview/use-artifact-preview";
import { Button } from "@/components/ui/button";

export function meta() {
  return [{ title: "Artifacts" }];
}

export function HydrateFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-b-2 border-foreground" />
    </div>
  );
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("en-US");
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ArtifactsRoute() {
  const artifacts = useResources("workspace");
  const { open } = useArtifactPreview();
  const navigate = useNavigate();

  const htmlArtifacts = (artifacts.data ?? [])
    .filter(
      (r) => r.path?.startsWith("artifacts/") && r.mimeType === "text/html",
    )
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  async function previewArtifact(resourceId: string, path: string) {
    await open({ resourceId, path });
    navigate("/");
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-semibold">Artifacts</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        HTML artifacts generated by the agent. Preview opens beside the chat.
      </p>
      {artifacts.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : htmlArtifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No artifacts yet. Ask the chat to generate an HTML page.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {htmlArtifacts.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {r.path.replace(/^artifacts\//, "")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatSize(r.size ?? 0)} · {formatDate(r.updatedAt ?? 0)}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => void previewArtifact(r.id, r.path)}
              >
                Preview
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ArtifactPreviewPanel />
    </div>
  );
}
```

Note: rendering `<ArtifactPreviewPanel />` here too means the preview also works if the user stays on `/artifacts`; the `navigate("/")` still brings them to chat where the panel persists. If the double-mount looks odd in practice, remove the panel from this page — the navigate covers the requirement.

- [ ] **Step 2: Add the sidebar nav item and label**

In `app/components/layout/Sidebar.tsx`, extend the `navItems` array (import `IconFileCode` from `@tabler/icons-react` alongside the existing icon imports):

```ts
const navItems = [
  {
    icon: IconMessageCircle,
    labelKey: "navigation.chat",
    href: "/",
    view: "chat",
  },
  {
    icon: IconFileCode,
    labelKey: "navigation.artifacts",
    href: "/artifacts",
    view: "artifacts",
  },
];
```

In `app/i18n/en-US.ts`, add inside the `navigation` block (alphabetical, after `navigation: {`):

```ts
    artifacts: "Artifacts",
```

- [ ] **Step 3: Verify manually**

Run `pnpm dev` if not running. Open `http://localhost:8080/artifacts` — the page lists `pulse-landing.html`, `nova-landing.html`, `orbit-landing.html`; clicking Preview navigates to the chat with the panel open showing the rendered page. The sidebar shows the Artifacts item.

- [ ] **Step 4: Typecheck, test, commit**

Run: `pnpm typecheck && pnpm test`
Expected: clean.

```bash
git add app/routes/artifacts.tsx app/components/layout/Sidebar.tsx app/i18n/en-US.ts
git commit -m "feat: artifacts browser page with preview"
```

---

### Task 4: Agent prompt + end-to-end verification

**Files:**
- Modify: `server/plugins/agent-chat.ts` (systemPrompt)

**Interfaces:**
- Consumes: `preview-artifact` action (Task 1); panel (Task 2).
- Produces: the agent auto-opens previews after creating HTML artifacts (PRD Requirement 3).

- [ ] **Step 1: Extend the system prompt**

In `server/plugins/agent-chat.ts`, append to the `systemPrompt` template string (inside the backticks, as a new final paragraph):

```
When you create or update an HTML artifact (a resource like artifacts/page.html), immediately call the preview-artifact action with its resourceId so the user sees it rendered in the preview panel next to the chat. Mention that the preview is open rather than pasting the HTML source into your reply.
```

- [ ] **Step 2: Restart the dev server**

```bash
lsof -ti:8080 | xargs kill 2>/dev/null; pnpm dev &
```

(Server plugins are not hot-reloaded reliably; a restart guarantees the new prompt and action registry are live.)

- [ ] **Step 3: End-to-end verification (PRD success criteria)**

In the browser at `http://localhost:8080`:
1. New chat: "generate a small dummy html page with one button that shows an alert-free toast, and show it to me". Expected: agent creates the artifact, calls `preview-artifact`, and the panel opens beside the chat with the rendered interactive page (criterion 1).
2. Open `/artifacts`, click Preview on `pulse-landing.html`. Expected: chat route with the panel rendering the Pulse page (criterion 2).
3. Click the panel's close button — panel closes; reload the page — panel stays closed (state honored).

- [ ] **Step 4: Full suite + commit**

Run: `pnpm typecheck && pnpm test`
Expected: clean.

```bash
git add server/plugins/agent-chat.ts
git commit -m "feat: agent auto-opens artifact previews after creation"
```

---

## Verification (definition of done, from the PRD)

1. Chat request for a landing page ends with the artifact rendered and interactive in the side panel — no download, no leaving the app.
2. Pre-existing artifacts (pulse/nova/orbit) preview from `/artifacts`.
3. `pnpm typecheck` and `pnpm test` pass; the panel test locks `sandbox="allow-scripts"` with no `allow-same-origin`.
4. `git log` shows the four feature commits; `git status` clean.
