# Framework upgrade plan: @agent-native/core 0.159.2 → 0.176.1

**Status:** QUEUED — execute on a dedicated branch after the Joney Jr. merge.
**Assessed:** 2026-08-31 against the upstream changelogs (packages/core/CHANGELOG.md
main + archive) covering 0.159.2 → 1.0.0.

## Target

- `@agent-native/core` **0.176.1** (npm `latest`, published 2026-08-28)
- `@agent-native/toolkit` **^0.17.6** (pairs with core 0.176.1)
- `@agent-native/dispatch` **~0.31.28** (published alongside 0.176.1; the old
  0.28.1 pin was empirical for core 0.159.2 — dispatch's peer range on core is
  loose `>=0.8.0`)
- Path: `pnpm upgrade:agent-native` from the workspace root (bumps deps,
  installs, refreshes scaffold skills, typechecks).

## Do NOT target 1.0.0 (yet)

Published the same day but deliberately not tagged `latest`. Two blockers:

1. **Major change `ea6123a`: removes the legacy settings view from agent chat
   surfaces** — collides with our settings integration.
2. **Minor change `e977e59`: auto-exposes eligible backend actions as WebMCP
   tools on authenticated app pages.** Our brain/personal-agent actions
   (`list-brain-entries`, `search-brain`, `save-brain-entry`,
   `get-personal-agent`, …) declare no exposure overrides — private-brain
   actions must NOT inherit page-embedded MCP exposure without a deliberate
   review. Before any 1.0.0 move, audit every action for `mcpTool` /
   `agentTool` / exposure config (defineAction gained `mcpTool`, `important`,
   `deferLoading` in 0.170.0 — adopt explicitly for the brain actions).

## Carried patches (patches/@agent-native__core.patch — must be redone; pnpm
patches are keyed to the exact version)

| Hunk | Upstream status | Action on upgrade |
|---|---|---|
| `dist/action.js` — strip lookaround regex from tool schemas (OpenAI 400s) | **FIXED in 0.165.0** (`b39f22c`, describes our exact bug incl. `z.string().email()`); related engine-boundary sanitization in 0.161.17 | Drop the hunk. Verify with a live OpenAI-engine run that loads `upsert-workspace-user-group`. Keep regression test `tests/action-schema-portability.test.ts`. |
| `dist/server/agent-chat-plugin.js` — 2 hunks: no `chat_threads.updated_at` bump on view/PUT-save nor on contentless zombie-run finalize | **NOT fixed** (no changelog entry touches it) | Re-apply against the new file (shape drifted 0.161–0.176). Re-test both scenarios. Candidate for an upstream report. |
| `dist/client/AssistantChat.js` — ghost-thread restore self-heal (client-minted id 404 → empty chat) | **Partially overlapping fixes** landed (0.161.0–0.168.9: multi-tab stale pointers, restore-error clearing, missing-thread replacement) but none names our exact repro | Re-test the exact repro (fresh tab id → reload → 404) before deciding drop vs re-apply. Regression test: `tests/thread-restore-ghost-heal.test.ts`. |

## App-side workarounds to retire if upstream fix confirms

- **Settings base-path routing** (commit 99f8b5f: controlled `SettingsTabsPage`
  + `app/lib/settings-tab-routing.ts`): likely fixed upstream in **0.162.0**
  (`0b57293` "Keep semantic settings URLs under the app's mounted workspace
  path" + `appBasePath()` first-segment fix). After upgrading, manually test
  `/chat/settings/<tab>` deep links, tab clicks, back/forward, and the MCP
  OAuth Connect link; only then consider removing the controlled-mode code
  (it is harmless to keep — it uses the documented `value`/`onValueChange`
  seam).
- **lazyContext persona/digest injection**: NOT addressed upstream. The prompt
  instruction in `server/plugins/agent-chat.ts` (read
  `instructions/personal-agent.md` + `instructions/personal-brain.md` via the
  resources tool) stays.

## Must re-verify after the bump

1. `pnpm typecheck && pnpm test && pnpm agent-native:doctor` from `apps/chat`.
2. **Production migration path** (0.164.9 changed the release-migration model:
   ~60 formerly ensure-on-demand tables now created by
   `runFrameworkReleaseMigrations`; new `guard:release-schema-complete`).
   Re-verify `scripts/migrate-production.ts` (incl. our `runBrainMigrations`
   registration and the release-probe writes) against Neon; one redeploy
   required per the upstream note.
3. `server/plugins/*` for deprecated option shapes (0.174.0:
   `createAgentChatPlugin({ model })` / `{ durableBackgroundRuns }` deprecated
   in favor of `agent.*` config; `observability` moved to `defineAppConfig()`).
4. Any code asserting on action failure shapes (0.173.1: `fail()` now throws
   `ActionContractError`, HTTP 400 default).
5. Joney Jr. golden path (welcome gate → ritual → brain → proposal card →
   cross-thread memory recall → Telegram card).
6. Dispatch app boots and its admin loads (0.28.1 → 0.31.x is ~40 releases;
   no breaking changes marked, but untested here).

## Post-upgrade findings (discovered while verifying 0.176.1 locally)

1. **New base-path bug instance**: `AgentWorkspaceContent` (agent-hub resource
   sub-tabs Files/Instructions/…/Learnings) pushStates bare
   `/settings/agent/resources/<id>` and dispatches a synthetic popstate. Under
   the /chat mount, React Router can observe the un-prefixed URL and force a
   full document load the gateway cannot route (blank white page; or a silent
   no-op depending on listener race). Fixed app-side: the settings route now
   intercepts `history.pushState`/`replaceState` while mounted and prefixes
   bare `/settings` URLs before they land (`prefixedSettingsHistoryUrl` in
   `app/lib/settings-tab-routing.ts`). Upstream-report candidate (same class
   as the 0.162.0-fixed tab bar, missed in the newer component).
2. **Workspace-app ACL (new in 0.176.x) fails closed in dev**:
   `isWorkspaceAppAccessAllowed` gates every `/api/*` + `/_agent-native/*`
   call. It needs (a) `A2A_SECRET` set (now in root `.env`; without it every
   request logs "No A2A secret available" and denies → the app looks logged
   out with no login button, since the session itself is fine), and (b) a
   reachable Dispatch registry: core builds the registry URL from
   `WORKSPACE_GATEWAY_URL` (root origin) but the dev gateway has no root
   `/_agent-native` route → 404 → deny. Worked around via
   `AGENT_NATIVE_ORG_DIRECTORY_URL=http://127.0.0.1:8080/dispatch` in root
   `.env` (orgDirectoryUrl wins and keeps its path prefix). NOTE: this pins
   the dev gateway to port 8080 — run ONE dev server; if the gateway runs on
   another port, update the var. Upstream-report candidate (dev gateway
   should route root `/_agent-native/*` to dispatch like the deploy wrapper).
3. **At production deploy, verify**: `A2A_SECRET` is set in Vercel env (it
   was provisioned at initial setup — confirm), and the deployed root
   `/_agent-native/actions/list-workspace-apps` reaches Dispatch (the Vercel
   deploy wrapper routes root `/_agent-native/*` to Dispatch by design). If
   chat 403s everyone with "You do not have access to this workspace app",
   this ACL is the cause.

## Nice-to-haves unlocked (adopt deliberately, not during the upgrade)

- 0.169.0 background/automation run recovery + checkpointing (relevant to the
  digest sub-project).
- 0.172.0 durable per-action approval preferences.
- 0.170.0 managed Google OAuth connections with personal/workspace sharing.
- 0.173.0 collapsible reasoning display (`thinkingDisplay`).
- 0.176.0 `agent.sourceSweepToolCallThreshold` + `agent.builtInEngines`.
