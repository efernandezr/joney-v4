# Standard Apps Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install 8 first-party Agent-Native apps (Forms, Tasks, Slides, Content, Design, Assets, Calendar, Analytics) into the Joney workspace, one at a time, each tested locally, gated by Enrique, and deployed to production before the next one starts.

**Architecture:** Each app is a sibling workspace app scaffolded from the installed core 0.176.1 templates via `pnpm exec agent-native create <id> --template=<id>`, mounted at `/<id>`, sharing auth/org/DATABASE_URL with chat and dispatch. Two workspace foundations land first: the chat-only base-path settings fixes move to `packages/shared`, and the Vercel build runs every app's `migrate:production` (ensure-tables DDL is a no-op on Vercel serverless, so unmigrated apps 500 in prod).

**Tech Stack:** @agent-native/core 0.176.1, @agent-native/dispatch 0.31.28, pnpm workspace, React Router, Neon Postgres (prod) / SQLite `apps/chat/data/app.db` (dev), Vercel.

## Global Constraints

- **Cadence (user decision 2026-09-01):** per-app deploy. One branch per app; local test → user gate → merge to main → push (= prod deploy) → prod smoke → next app.
- **Credentials (user decision):** deferred. Phases 2-9 test each app's standalone core features only. Google OAuth, Notion, Figma, generation provider keys, Analytics data sources, and Forms destinations are Phase 10.
- **Test gate (user decision):** every app phase pauses for Enrique's hands-on test before merge. Do not merge an app phase without his explicit OK.
- **Plan dropped, Tasks + Slides added (user decision):** the `plan` template is coding-agent tooling, not marketing planning. Install order: forms, tasks, slides, content, design, assets, calendar, analytics.
- Merge/push is blocked for the agent by the permission classifier in this session. Enrique runs `git merge` / `git push` himself (via `! <command>` in the prompt) or grants `Bash(git merge:*)` + `Bash(git push:*)` permission rules.
- Never run `pnpm patch`, edit `node_modules`, or add `pnpm.patchedDependencies` (workspace rule). Core bugs get app-side or shared-package workarounds.
- No `lucide-react` or other icon libs; templates use `@tabler/icons-react` — verify, don't add.
- Every new app's `apps/<id>/package.json` must carry a concise human-readable `description` (Dispatch listing + A2A context depend on it). Descriptions are specified per phase below.
- Root `.env` already carries dev `A2A_SECRET` and `AGENT_NATIVE_ORG_DIRECTORY_URL=http://127.0.0.1:8080/dispatch` (0.176 fail-closed workspace-app ACL). Run exactly ONE `pnpm dev` (gateway pinned to 8080).
- Production is https://joney-v4.vercel.app (GitHub `efernandezr/joney-v4`, auto-deploys main). `A2A_SECRET` verified present in Vercel Production env (2026-09-01). Hard-reload open tabs after every deploy before judging results.
- Dev DB is shared: agent "Potito" and Joney Jr. data live in `apps/chat/data/app.db`. Never delete or reset it.

---

## Phase 0: Deploy pending main (Joney Jr. + core 0.176 upgrade)

Everything already merged locally but never pushed: 22 commits (18 Joney Jr. + upgrade prep) plus the 3 upgrade-branch commits. One deploy ships both.

**Files:** none (git + Vercel only).

- [ ] **Step 0.1: Enrique fast-forwards main and pushes** (agent is permission-blocked)

```bash
# from repo root, on main (already checked out):
git merge --ff-only upgrade/agent-native-0.176
git push origin main
```

Expected: main HEAD `8f139f6`, Vercel production build starts automatically.

- [ ] **Step 0.2: Watch the Vercel build**

Run: `vercel ls joney-v4 2>&1 | head -5` until the newest deployment shows Ready (build includes `migrate:production`; check logs with `vercel inspect --logs <url>` if it fails).
Expected: Ready. In build logs, `migrate:production` ran and `brain_entries` migration applied on Neon (first release since migrate-production gained runBrainMigrations).

- [ ] **Step 0.3: Production smoke (browser, hard-reload first)**

1. https://joney-v4.vercel.app/chat loads and does NOT show "You do not have access to this workspace app" (if it does: A2A/ACL — check `A2A_SECRET` env and root `/_agent-native/actions/list-workspace-apps` reaching Dispatch).
2. Sign in, open an existing thread, send a message, agent replies.
3. Settings → tabs switch without the URL dropping `/chat`; agent-hub resource sub-tabs open without a white page.
4. /dispatch loads.
5. Joney Jr. golden-path spot check: welcome gate → ritual entry visible for a fresh member (or memory recall on an existing agent).

- [ ] **Step 0.4: Cleanup + record**

```bash
git branch -d upgrade/agent-native-0.176
```

Update memory (`joney-ai-project.md`): production now on core 0.176.1, Joney Jr. live.

---

## Phase 1: Workspace foundations

Two changes every subsequent app depends on. Own branch, own (low-risk) deploy to validate the migration-runner change before any new app needs it.

### Task 1.1: Move base-path settings fixes to `packages/shared`

Core 0.176 still has both base-path bugs chat patched app-side: (a) `buildSettingsRoute` hardcodes `/settings` and `SettingsTabsPage` pushStates it raw, dropping the `/<app>` mount prefix; (b) agent-hub resource sub-tabs pushState bare `/settings/agent/resources/<id>` → blank page. Every new app mounted at `/<id>` inherits them. The fix (controlled `SettingsTabsPage` + tab-id alias helpers + pushState prefix interceptor) currently lives only in chat.

**Files:**
- Create: `packages/shared/src/settings-routing.ts` (move the contents of `apps/chat/app/lib/settings-tab-routing.ts` — tab-id normalization/alias maps, `prefixedSettingsHistoryUrl`, popstate repair helper)
- Modify: `apps/chat/app/lib/settings-tab-routing.ts` → thin re-export from `@joney/shared` (or delete and update imports in chat's settings route)
- Modify: chat's settings route file (the one from commits 99f8b5f/8f139f6) to import from the shared package
- Test: move/point the existing settings-routing unit tests at the shared module (`apps/chat/tests/` — keep them running under chat's vitest config, importing the shared source)

**Interfaces:**
- Produces: `normalizeSettingsTab(tabId: string): string`, `settingsTabPath(basePath: string, tabId: string): string`, `prefixedSettingsHistoryUrl(url: string, basePath: string): string`, `installSettingsHistoryGuard(basePath: string): () => void` (wrap `history.pushState`/`replaceState` while a settings route is mounted; returns uninstaller). Exact names: match what `apps/chat/app/lib/settings-tab-routing.ts` already exports — MOVE, do not redesign.
- Consumed by: each app phase's "wire settings fix" step (Phases 2-9).

- [ ] Step 1: Read `apps/chat/app/lib/settings-tab-routing.ts` and the settings route from commits `99f8b5f` and `8f139f6` (`git show 99f8b5f --stat`, `git show 8f139f6 --stat`) to get the exact current exports and the route wiring pattern.
- [ ] Step 2: Move the module to `packages/shared/src/settings-routing.ts` verbatim; export from the shared package index.
- [ ] Step 3: Update chat imports; run existing settings-routing tests: `pnpm --filter chat test` → all pass (112+).
- [ ] Step 4: Browser check in dev (`pnpm dev`, http://127.0.0.1:8080/chat): settings tabs keep `/chat` prefix; agent-hub resource sub-tab opens without white page.
- [ ] Step 5: Commit: `refactor: move base-path settings routing fixes to packages/shared`

### Task 1.2: Run every app's production migrations at deploy

**Files:**
- Modify: `vercel.json` (root)

Current buildCommand migrates only chat. Every template ships `migrate:production` (verified 2026-09-01 in the 0.176.1 corpus), so switch to a recursive `--if-present` run:

- [ ] Step 1: Edit `vercel.json`:

```json
{
  "buildCommand": "npx @agent-native/core@latest deploy --preset vercel --build-only && if [ \"$VERCEL_ENV\" = \"production\" ]; then pnpm -r --if-present run migrate:production; fi",
  "installCommand": "pnpm install",
  "framework": null
}
```

- [ ] Step 2: Sanity check locally that recursion targets what we expect: `pnpm -r --if-present run migrate:production --dry-run 2>/dev/null || pnpm -r exec node -e ""` — simpler: `pnpm -r --if-present run migrate:production` is only safe against prod DB, so instead verify the package list: `pnpm -r ls --depth -1 | grep -E "chat|dispatch"` and `grep -l "migrate:production" apps/*/package.json`. Expected: today only `apps/chat` has the script (dispatch check: if dispatch also has one, it now runs — read it before merging to confirm it is idempotent).
- [ ] Step 3: Commit: `chore: run migrate:production for all workspace apps at deploy`

### Task 1.3: Merge, deploy, verify no regression

- [ ] Step 1: `pnpm --filter chat test` + `pnpm --filter chat run typecheck` clean.
- [ ] Step 2: USER GATE — Enrique OKs; merges branch to main and pushes.
- [ ] Step 3: Prod smoke = Phase 0 Step 0.3 items 1-4. Build logs show chat's migrate:production still ran.

---

## Phases 2-9: One phase per app

Standard procedure for every app phase (referenced as "STD" below; app-specific values and smoke scripts are listed per phase — commands are repeated there where they differ):

1. Branch from fresh main: `git checkout -b add-app/<id> main` (Enrique or permission rule; branch creation may pass the classifier — try it).
2. Scaffold from workspace root: `pnpm exec agent-native create <id> --template=<id>` (non-interactive; the gateway auto-discovers `apps/<id>` — no registry to edit).
3. Set the `description` field in `apps/<id>/package.json` (exact text per phase).
4. Verify scaffold hygiene: `grep -r "lucide-react" apps/<id>/package.json` → no match; `grep -rn "appBasePath" apps/<id>/app/entry.client.tsx` → present; `grep -n "migrate:production" apps/<id>/package.json` → present.
5. Wire the shared settings fix from Task 1.1 into the app's settings route, following chat's pattern (controlled `SettingsTabsPage` + `installSettingsHistoryGuard`). If the template has no custom settings route, reproduce the bug first in dev (open `/<id>/settings`, click a tab, watch the URL); only wire the fix if the bug manifests — record the result either way.
6. `pnpm install`, then `pnpm --filter <id> run --if-present typecheck`, `pnpm --filter <id> run --if-present test`, `pnpm --filter <id> exec agent-native doctor`.
7. Table-collision check (all apps share one DB): list the app's schema table names (`rg -o "\"[a-z_]+\"" apps/<id>/db/schema* | sort -u` or read the schema file) and compare against already-installed apps' schemas. First-party templates are designed to coexist, so expect no collisions — but verify, don't assume.
8. Dev smoke (browser at `http://127.0.0.1:8080/<id>` with the single `pnpm dev` gateway): app-specific script per phase below. Always also: sign in with the existing dev session (shared auth), agent sidebar/chat responds, settings tabs keep the `/<id>` prefix.
9. Regression smoke: `pnpm --filter chat test` still green; /chat opens a thread; /dispatch loads and its Apps page lists the new app.
10. USER GATE: pause; Enrique tests hands-on and says go.
11. Commit(s) on the branch; Enrique merges to main and pushes (prod deploy).
12. Prod smoke: hard-reload; FIRST open https://joney-v4.vercel.app/dispatch/apps once — Dispatch's registry sync auto-inserts the new app's `workspace_apps` row, and until it exists the 0.176 fail-closed ACL 403s every action with "You do not have access to this workspace app" (learned in Phase 2). Then https://joney-v4.vercel.app/<id> loads, sign-in session shared, one core record created via UI, agent replies; /chat unaffected. Build logs show the new app's `migrate:production` ran (Task 1.2).
13. Update memory index line for the project (which apps are live).

Anything that fails at step 12 gets fixed forward on a hotfix branch before the next phase starts.

### Phase 2: Forms (`forms`)

The validation app: zero external credentials, exercises the full pipeline including a public unauthenticated route in prod.

- Scaffold: `pnpm exec agent-native create forms --template=forms`
- `package.json` description: `"Build and publish forms with the agent, share public links, and collect and route responses."`
- [ ] STD steps 1-7.
- [ ] Dev smoke: open `/forms`; in Ask Forms chat, prompt "Create a beta signup form with name, email, role, and team size"; form appears; open the visual editor and reorder a field; publish; open the public fill link in a private browser window (unauthenticated); submit; see the response in the responses view; ask the agent "summarize this week's submissions".
- [ ] STD steps 9-10 (USER GATE).
- [ ] STD steps 11-13. Prod extra: public fill link works unauthenticated in prod.

### Phase 3: Tasks (`tasks`)

- Scaffold: `pnpm exec agent-native create tasks --template=tasks`
- Description: `"Team task lists with inbox, custom fields, and drag-and-drop ordering — the campaign planning backbone."`
- [ ] STD steps 1-7.
- [ ] Dev smoke: create a task list and 3 tasks via UI; drag to reorder; add a custom field (e.g. "Channel"); ask the agent "add a task to draft the newsletter, due Friday" — task appears WITHOUT manual refresh (real-time sync check); mark done from chat.
- [ ] STD steps 9-13 with USER GATE.

### Phase 4: Slides (`slides`)

- Scaffold: `pnpm exec agent-native create slides --template=slides`
- Description: `"Generate presentation decks from a prompt, edit visually, and present full-screen."`
- [ ] STD steps 1-7.
- [ ] Dev smoke: prompt the agent "Create a 5-slide deck introducing a Q4 campaign kickoff"; deck generates; edit one slide's text visually; reorder slides; present full-screen; export (whatever formats the template offers) — note which brand/design-system hooks exist for Phase 10/customization.
- [ ] STD steps 9-13 with USER GATE.

### Phase 5: Content (`content`)

Heaviest template (49 deps) — watch install/build time. Notion sync is Phase 10; test standalone editing only.

- Scaffold: `pnpm exec agent-native create content --template=content`
- Description: `"Collaborative Markdown/MDX document workspace with Notion-style databases and agent-assisted writing."`
- [ ] STD steps 1-7.
- [ ] Dev smoke: ask the agent "create a page called Q4 Planning with sub-pages Goals, Metrics, Risks"; tree appears; open Goals, type in the editor; select a paragraph and ask the agent "rewrite this to be more concise" — verify it edits the selection (context-awareness); add a database block; confirm Notion connect surface exists but degrades gracefully unconnected.
- [ ] STD steps 9-13 with USER GATE. Watch the Vercel build duration on this deploy; if it jumps sharply, note it — build-time budget matters for the remaining phases.

### Phase 6: Design (`design`)

Figma import is Phase 10; design systems from description/website work standalone.

- Scaffold: `pnpm exec agent-native create design --template=design`
- Description: `"Agent-native HTML prototyping studio: brand design systems, prompt-generated Alpine/Tailwind prototypes, live preview, and code export."`
- [ ] STD steps 1-7.
- [ ] Dev smoke: create a design system by describing a brand (colors, type, tone) — first one becomes workspace default; generate a prototype ("a landing page hero for a webinar signup"); verify it inherits the system's tokens; revise via prompt ("denser hero, clearer CTA"); switch preview modes (desktop/mobile); export the HTML.
- [ ] STD steps 9-13 with USER GATE.

### Phase 7: Assets (`assets`)

Generation needs provider keys (Phase 10); DAM features work standalone. Large files must land in blob storage, not SQL — verify the template's upload provider wiring against our Vercel setup.

- Scaffold: `pnpm exec agent-native create assets --template=assets`
- Description: `"Digital asset manager for brand libraries, references, and on-brand image and video generation."`
- [ ] STD steps 1-7. Extra: read `apps/assets/server/` upload/blob-provider config and confirm what prod needs (S3/blob credentials?) — if uploads require a provider we haven't configured, uploads are part of Phase 10 for this app and dev smoke shrinks accordingly; record the finding.
- [ ] Dev smoke: create a library and folders; upload a small image (if local provider works); tag it as a reference; verify generation UI degrades gracefully with no provider key (secrets should surface in the agent sidebar settings via the framework secrets primitive, not crash).
- [ ] STD steps 9-13 with USER GATE.

### Phase 8: Calendar (`calendar`)

Most value is behind Google OAuth (Phase 10). This phase = install + local events + graceful degradation.

- Scaffold: `pnpm exec agent-native create calendar --template=calendar`
- Description: `"Agent-powered calendar and booking links: schedule, manage availability, and book meetings."`
- [ ] STD steps 1-7.
- [ ] Dev smoke: create an event via UI; ask the agent "schedule a 30-minute review tomorrow at 10" and verify it lands; confirm the Google connect flow surfaces cleanly (do NOT connect); check the booking-links surface exists and states its Google requirement rather than erroring.
- [ ] STD steps 9-13 with USER GATE.

### Phase 9: Analytics (`analytics`)

Real value needs data sources (Phase 10). This phase = install, boot, agent answers, connector surfaces present.

- Scaffold: `pnpm exec agent-native create analytics --template=analytics`
- Description: `"Ask analytics questions in plain English and get charts, dashboards, and alerts over connected data sources."`
- [ ] STD steps 1-7. Extra: the template includes an S3 upload provider (session replay); confirm it's inert without credentials.
- [ ] Dev smoke: app boots; connectors/data-source settings list available source types; ask the agent an analytics question and verify it responds with a sensible "no data source connected" path rather than hallucinating; create an empty dashboard.
- [ ] STD steps 9-13 with USER GATE.

---

## Phase 10: Integrations & credentials pass (deferred by user decision)

One sub-task per credential, in whatever order Enrique can supply them. All keys go through the Dispatch vault / framework scoped-secret resolver (`resolveSecret` from `@agent-native/core/server`) — never `.env` or source. Each sub-task ends with re-running the relevant app's dev smoke plus the previously-skipped integration steps.

- [ ] **Forms destinations:** connect a Slack webhook (and/or Google Sheets) and verify a submission routes to it.
- [ ] **Calendar ↔ Google:** Enrique creates the Google Cloud OAuth app; wire client id/secret via vault; connect a calendar; verify two-way sync and create a public booking link; book it from a private window.
- [ ] **Content ↔ Notion:** Notion integration token via vault; sync a page both directions.
- [ ] **Design ↔ Figma:** Figma token via vault; import a frame; verify the convert-vs-approximate report.
- [ ] **Assets generation:** image/video provider keys via vault (provider TBD by Enrique); generate against an approved reference set; confirm blob storage (not SQL) holds the output.
- [ ] **Analytics data sources:** connect the first real source (candidate: the workspace's own Neon DB for product analytics, or a marketing source when identified); build one saved dashboard panel from a plain-English question; configure the S3 provider only if session replay is wanted.

## Phase 11: Wrap-up

- [ ] Update memory (`joney-ai-project.md`): apps live in prod, credential status, any new gotchas per app.
- [ ] Add new gotchas discovered during rollout to `agent-native-gotchas.md`.
- [ ] Revisit the queued customization backlog with the new foundation in place: brand-kit / design-system unification across Design/Assets/Slides, marketing automations, cross-app A2A workflows (Forms→Tasks lead follow-ups, Content→Slides repurposing, digest over Analytics).

## Known risks

- **Vercel build time & function count** grow with each app (10 apps total by Phase 9). Watch build duration each deploy; if limits approach, options are Vercel build cache tuning or consolidating rarely-changed apps — decide only if it actually bites.
- **Settings base-path bugs** are upstream (core 0.176). If a template ships its own settings route variant, the Task 1.1 shared fix may need per-app adaptation — the per-phase "reproduce first" step catches this.
- **Do NOT upgrade to core 1.0.0** during this rollout (removes legacy settings view, auto-exposes actions as WebMCP tools; brain actions need privacy review first).
- **`chat_threads.updated_at` bumps on view** remains an accepted upstream quirk; unrelated to this rollout.
