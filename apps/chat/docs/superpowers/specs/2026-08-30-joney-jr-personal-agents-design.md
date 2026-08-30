# Joney Jr. — Personal Agents: Design Spec

**Status:** Approved (2026-08-30) | **PRD:** `docs/prds/2026-08-21-joney-product-concept.md` (R9)
**Sub-project:** 1 of 5 (personal agents → team brain → campaign spaces → digest → branding)

## Goal

Every team member gets a personal agent they create, name, and grow
("Joney Jr."). MVP scope: birth ritual, visible curated private brain,
skill capture from successful conversations, Telegram access. Everything
private-by-default to the member.

Success test: the 3 POC pilot members migrate in, each creates their agent
in under 10 minutes, and within the first week each has kept brain entries
and at least one saved skill without assistance.

## Decisions (from brainstorm, user-approved)

1. **First run = birth ritual** (option A): agent does not exist until the
   member creates it in a short guided conversation. Managers may pre-seed
   role *facts* only, never personality.
2. **Private brain = visible and curated** (option B): structured, editable
   entries; agent proposes memories, member approves. Never silent capture.
3. **Skills = capture from success** (option A): "save this as a skill"
   from a working conversation, built on the framework's turn-into-skill
   mechanism. No blank-page skill editor in MVP.
4. **Telegram = full loop in MVP** (option A): link identity once, then the
   member's own agent (persona + brain + skills) responds in Telegram.

## Architecture

### Persona and identity

- Persona stored as a personal-scope agent resource (personal instructions
  are read every turn by the framework). Contains: agent name, short
  description, tone/style preferences, member's role context.
- `apps/chat/server/plugins/agent-chat.ts` already customizes the system
  prompt; extend it to render the member's persona into the prompt.
- UI displays the agent's name (sidebar header, chat title) so the product
  reads as "Max", not "Chat". No sparkle/wand/robot iconography (workspace
  rule).

### Private brain

- New app table `brain_entries` via `@agent-native/core/db/schema` helpers
  with `ownableColumns()` (owner_email, org_id, visibility default
  `private`):
  - `type`: `fact | preference | lesson | note`
  - `title`, `body`
  - `source_thread_id` (nullable reference, provenance)
  - `status`: `proposed | kept`
  - `promotable` (boolean, default false) — hook for sub-project 2's
    promote-to-team flow; unused in MVP.
- Actions (all owner-scoped, GET for reads):
  - `list-brain-entries`, `save-brain-entry`, `update-brain-entry`,
    `delete-brain-entry`
  - `propose-memory` — called by the agent after conversations; creates a
    `proposed` entry. POC rule: propose durable memory, never silently
    record.
  - `search-brain` — retrieval for the agent when the digest isn't enough.
- Context injection: compact digest rendered into the system prompt — all
  kept `preference` entries plus the N most recent kept entries of other
  types (N chosen at implementation, token-budgeted); `search-brain` for
  depth beyond the digest.
- UI: "My Brain" page — entries grouped by type, edit/delete inline,
  proposals inbox (approve → `kept`, dismiss → delete). Inline one-tap
  keep/dismiss on proposal cards in chat.

### Skills

- Reuse the framework turn-into-skill mechanism → personal-scope
  `skills/<slug>/SKILL.md`.
- "Save as skill" affordance on threads; agent proactively offers after a
  visibly successful workflow (prompt guidance, not a classifier).
- "My Skills" page lists personal skills with plain-language names;
  invocation via slash or natural language.

### Telegram

- Built-in adapter: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, one
  `POST /_agent-native/integrations/telegram/setup` per deployment.
- Identity: framework link-token flow (`create-link-token` /
  `/link TOKEN`), surfaced as a "Connect Telegram" card in-app.
- One shared bot for the deployment in MVP (PRD decision); linked members
  get their own persona/brain/skills through it. Per-member bot identity is
  P1.

### First-run flow

1. Invited member lands on a welcome screen; one primary action: "Create
   your agent".
2. Birth ritual runs through the normal agent chat via `sendToAgentChat()`
   with hidden context (ritual script: name, what you work on, how should I
   talk to you). Agent writes persona + initial brain entries via actions
   as the conversation progresses.
3. Completion marker in application state flips the app to normal mode;
   ritual is resumable if abandoned.
4. Post-ritual: "Connect Telegram" card.
5. Manager pre-seed (optional): role facts staged as `proposed` brain
   entries the member sees and keeps/dismisses on arrival.

## Error handling and security

- All brain/persona data scoped owner + org, visibility `private`; no admin
  read path into member content (POC parent-information-contract as product
  policy).
- Writes verified by re-read before reporting success (app rule).
- Ritual interrupted → resumable via completion marker; Telegram link
  failure → retryable card; never dead ends.
- `propose-memory` validates input; no secrets/PII echoing in proposals
  (body length caps, standard input validation per security skill).

## Testing

- Server tests (plugin-free vitest config, isolated db): brain actions
  cannot cross owners or orgs; proposals require approval to become kept;
  persona loads for the correct user; ritual completion marker behavior.
- Manual golden path: invite → ritual → chat → memory proposal →
  keep/dismiss → save skill → link Telegram → full loop from Telegram.

## Out of scope (this sub-project)

Promotion-to-team-brain (sub-project 2; `promotable` flag is the hook),
per-member Telegram bot identity (P1), weekly reflection/roundtable ritual
(P1), campaign spaces, digest, artifact branding.
