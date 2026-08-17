# Artifact Live Preview — Technical Design

**Date:** 2026-08-17 · **PRD:** `docs/prds/2026-08-17-artifact-live-preview.md` · **Status:** Approved

## Summary

A collapsible right-hand panel next to the chat renders HTML artifacts (workspace resources under `artifacts/`) in a fully sandboxed iframe. One shared app action, `preview-artifact`, opens the panel from both the agent (tool call after creating an artifact) and the UI (artifacts browser page). No framework code is ejected; no new server endpoints are added.

## Architecture

The feature follows the framework's core pattern: **one action, driven through application state, consumed by agent and UI alike.**

```
agent creates artifact ─┐
                        ├─> action preview-artifact ─> writeAppState("artifact-preview", {resourceId, path})
artifacts page (user) ──┘                                        │ (SSE sync)
                                                                 v
                                              ArtifactPreviewPanel (subscribed)
                                              └── <iframe sandbox="allow-scripts" srcdoc={content}>
```

- Application-state key: `artifact-preview` with value `{ resourceId: string, path: string } | null`. `null` (or absent) = panel closed. Writing a value opens the panel; the panel's close button writes `null` via `writeClientAppState` (with `{ requestSource: TAB_ID }` to pair with `useDbSync({ ignoreSource: TAB_ID })` jitter prevention).
- Resource content is fetched client-side with the framework's `useResource(resourceId)` hook (`@agent-native/core/client/resources`); the framework routes are already auth-gated. No new server route.

## Components

**1. `actions/preview-artifact.ts`** — `defineAction` with zod schema `{ resourceId: z.string() }`.
- `run`: load the resource via the framework resources store (`resourceGet`); error if not found or `mimeType !== "text/html"`; then `writeAppState("artifact-preview", { resourceId, path })` (`@agent-native/core/application-state`) and return `{ opened: true, path }`.
- `readOnly: false` (it mutates UI state so the completion event triggers client refetch), `toolCallable: true`. Description written for the agent: "Open an HTML artifact in the user's preview panel."

**2. `app/components/preview/ArtifactPreviewPanel.tsx`** — the panel.
- Rendered by `Layout.tsx` inside `.agent-layout-main-surface` as a sibling of `contentFrame`, chat routes only (`isChatRoute`).
- Subscribes to the `artifact-preview` state (framework client app-state helpers + `useDbSync` invalidation, same pattern the template uses for `navigation`).
- When open: header (artifact file name, switcher, collapse/close button), body = `<iframe sandbox="allow-scripts" srcdoc={content} title={path}>`. **Never `allow-same-origin`** — LLM-generated HTML must run in an opaque origin with no cookies, storage, or app API reach.
- Switcher: dropdown listing `text/html` resources under `artifacts/` (via `useResources` filtered client-side); selecting one calls the `preview-artifact` action through the framework action hook, so the agent's context stays aware of what the user is viewing.
- Width: fixed default (~45%) with a collapse toggle; no resize/persistence this milestone (PRD Assumption 4).

**3. `app/routes/artifacts.tsx`** — browser page at `/artifacts`.
- Lists `artifacts/*` HTML resources (name, size, updated date) using framework resource hooks; English labels.
- Row action "Preview" calls `preview-artifact` via the action hook and navigates to `/` (chat) if not already on a chat route, where the panel opens.
- Added to the left `Sidebar` as a nav item.

**4. Agent prompting** — `server/plugins/agent-chat.ts` system prompt gains one line: after creating or updating an HTML artifact, call `preview-artifact` with its resourceId so the user sees it immediately. This produces the in-chat CTA trail (the action's result row) and the Claude-style side-panel outcome without the user asking.

## Data flow

1. Agent path: create resource → call `preview-artifact` → server writes app state (tagged `requestSource: "agent"`) → SSE `useDbSync` invalidates → panel opens.
2. User path: `/artifacts` page → Preview → same action via hook → same state → same panel.
3. Close: panel writes `artifact-preview = null` client-side; agent could also close it via the action pattern later (out of scope).

## Error handling

- Action: resource not found → contract error "Artifact not found"; wrong mime type → "Only HTML artifacts can be previewed (got <mime>)". Both are agent-relayable strings.
- Panel: resource fetch error → compact error card with Retry (refetch); loading → spinner; content > 1 MB → notice with a Download link (`resourceDownloadUrl(id)`) instead of rendering (PRD "large artifacts" risk).

## Testing

- `tests/preview-artifact-action.test.ts`: action happy path writes state and returns `{opened: true}`; not-found and non-HTML inputs reject with the exact error messages.
- `tests/artifact-preview-panel.test.tsx`: renders iframe with `sandbox="allow-scripts"` and asserts `allow-same-origin` is absent (security property locked by test); shows error card on fetch failure.
- End-to-end (manual, defines done per PRD): in the running app, ask the chat to generate a landing page → panel opens with the rendered page; open `pulse-landing.html` from `/artifacts` → renders.

## Out of scope (from PRD)

Transcript auto-render, non-HTML previews, editing, sharing URLs, i18n of panel labels, panel resize persistence.

## Upgrade-safety notes

Everything added is app-owned (`actions/`, `app/components/preview/`, `app/routes/artifacts.tsx`, one prompt line). The only framework-coupled surfaces are documented public APIs (`defineAction`, app-state helpers, resource hooks), which the framework's own skills present as the intended extension points.
