# PRD: Artifact Live Preview

**Status:** Draft | **Date:** 2026-08-17 | **Owner:** Enrique Fernandez

## Problem

Joney AI's agent already generates HTML artifacts (landing pages, mini-apps) and stores them as workspace resources, but the app has no way to view them. Users see a file card with a Download button and must save the file and open it locally to see what was created. The core "ask for something, see it" loop of an AI-native app is broken at the last step.

## Users and context

- Primary user at this stage: **the developer/owner (Enrique), testing and iterating on what Joney AI can generate** (Decision Q1). Product-grade polish for external end users is a later milestone; this PRD notes the path but does not gold-plate.
- Joney AI is an Agent-Native chat app (React Router v8 + Nitro + SQLite). Artifacts are rows in the `resources` table (`path`, `mime_type`, `content`, `visibility`), e.g. `artifacts/pulse-landing.html` (9.1 KB, text/html).

## Success criteria

(User-stated, Decision Q2)

1. "I ask the chat for a landing page and can see it rendered and interact with it without leaving the app or downloading anything."
2. The already-existing artifacts (`pulse-landing.html`, `nova-landing.html`, `orbit-landing.html`) are previewable the same way.

## Requirements

**P0**

1. **Collapsible side panel** next to the chat that renders an HTML artifact (Decision Q4). Open/close without losing chat state.
2. **Sandboxed rendering** (Decision Q5): artifact HTML runs in an iframe with `sandbox` (scripts allowed, no same-origin), loaded via `srcdoc` from the resource content — no access to app APIs, cookies, or storage. Non-negotiable for LLM-generated HTML.
3. **In-chat CTA** (Decision Q4): when an artifact is produced or referenced in chat, the user sees a clear call-to-action (similar to Claude.ai inline artifact outcomes) that opens it in the side panel.
4. **Artifacts browser** (Decision Q3-iii): a simple page listing stored HTML artifacts (name, size, date) where any item can be opened in the preview.
5. Works for existing stored artifacts, not only newly generated ones (Success criterion 2).
6. UI labels in English only for this milestone (Decision Q5).

**P1 (path to product-grade, later milestone)**

7. Localized labels via the app's existing i18n files.
8. Preview for non-HTML artifacts (markdown, images) (deferred per Decision Q3-iv).

## Out of scope

(User-confirmed, Decision Q3)

- Automatic Claude-style rendering of every HTML artifact inside the transcript (would require ejecting framework-owned transcript UI; high upgrade cost).
- Non-HTML file previews (deferred to P1+).
- Editing artifacts in the preview, sharing/public URLs, version history.

## Current state (verified)

- Artifacts are stored in the `resources` SQL table; verified rows exist (`artifacts/*.html`, text/html, `workspace` visibility) in `data/app.db`.
- The framework already exposes auth-gated REST routes: `GET /_agent-native/resources/:id` (content), plus list/tree routes (`@agent-native/core/dist/server/resources-plugin.js`). No new content endpoint is strictly required; `srcdoc` rendering is hosting-agnostic (works unchanged on the future Vercel deploy).
- Extension framework tools were enabled in `server/plugins/agent-chat.ts` (`frameworkTools: { extensions: true }`), so chat shows file cards with Download; the extension runtime demonstrates the sandboxed-iframe pattern in this codebase.
- `render-inline-extension` proved unreliable for full-page payloads (tool calls interrupted at ~9 KB); this PRD's approach renders from stored resources instead of streaming payloads, avoiding that failure mode.
- The chat transcript (including file cards) is framework-owned (`AgentChatSurface`/`AssistantChat`); app-owned surfaces (panels, routes, pages) are the supported customization path (`customizing-agent-native` skill). `react-resizable-panels` is already a dependency.

## Decision log

| Q | Decision (2026-08-17) |
|---|---|
| Q1 Who is this for | Developer-grade for the owner now; note path to product-grade later |
| Q2 Success criteria | See Success criteria, stated verbatim; includes existing artifacts |
| Q3 What gets previewed | In: preview from chat CTA (i) + artifacts browser page (iii). Out: transcript auto-render (ii). Deferred: non-HTML (iv) |
| Q4 Where it renders | Collapsible side panel next to the chat; in chat only a CTA, similar to Claude.ai inline outcomes |
| Q5 Constraints | Fully sandboxed iframe (no app API/cookie access); no timeline pressure; English-only labels |

## Assumptions (unconfirmed)

1. **Multiple artifacts in one thread:** the panel shows the most recently opened artifact and offers a simple switcher (e.g. dropdown) for others. Not asked; adjust at design review if wrong.
2. **Browser page behavior:** the artifacts page opens previews in the same panel/pattern rather than a separate full-page layout.
3. **CTA placement mechanics:** because the transcript is framework-owned, the CTA may render adjacent to (not inside) the framework file card, or via the agent's message content. Exact placement is a design-phase decision; the product requirement is only "a clear CTA in the chat flow".
4. **Panel defaults:** initial width and open/closed persistence follow whatever is simplest with `react-resizable-panels`; no user preference storage this milestone.

## Risks

- **Framework-owned transcript:** if a CTA inside the file card itself proves impossible without ejecting framework UI, the fallback (adjacent CTA / message-level link) must still satisfy Requirement 3. Flag at design time.
- **LLM-generated HTML is untrusted:** mitigated by Requirement 2 (sandbox, no same-origin). Any future weakening of the sandbox (e.g. allowing app API access for interactive artifacts) needs its own security review.
- **Framework upgrades:** app-owned panel and route are upgrade-safe; only the CTA integration point carries upgrade risk.
- **Large artifacts:** `srcdoc` embeds the full HTML string in the DOM; fine at tens of KB (current artifacts ~9-19 KB), revisit if artifacts grow to MBs.
