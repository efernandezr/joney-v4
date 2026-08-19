# Joney AI — Milestone 1: Agent-Native Chat App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Context

Enrique is building "Joney AI", a domain-specific AI platform for external users (domain to be defined via future PRDs). The foundation is the BuilderIO Agent-Native framework, whose core value is that the agent and the UI share the same typed actions, SQL data, and app state. Milestone 1 is intentionally thin: scaffold the official **chat template** (a ChatGPT-style shell with durable threads, Better Auth, live sync, and one example action), wire it to **OpenAI**, and verify a real chat round-trip locally. Every future feature builds on this as a separate spec → plan → build cycle.

**Goal:** A running Agent-Native chat app at `http://localhost:8080` in `/Users/enriquefernandez/AI-dev/JoneyAI-4`, answering chat messages via OpenAI, under git version control.

**Architecture:** Official `chat` template scaffolded standalone (self-contained auth via Better Auth, no Builder platform dependency). React Router v8 + React 19 + Vite + Tailwind/shadcn frontend; Nitro server; local SQLite via `@libsql/client` (files in `data/`, created automatically — no migration step needed). Provider configured via `OPENAI_API_KEY` in `.env`.

**Tech Stack:** Node >= 22.22.0 (installed: v22.23.1), pnpm (installed: 10.34.5), @agent-native/core, TypeScript, Vitest.

## Global Constraints

- App name: `joney-ai`; app lives at the repo root `/Users/enriquefernandez/AI-dev/JoneyAI-4` (not a subfolder).
- AI provider: OpenAI via `OPENAI_API_KEY` env var. The key is provided by the user directly into `.env` — never committed, never echoed into chat/logs.
- Out of scope: deployment itself, custom actions, other modules (Calendar, Mail, ...), branding, auth changes. Keep template defaults (auth enabled).
- **Future deployment target: Vercel** (near-term, not this milestone). Decisions now must not block it — see "Vercel considerations" below.
- No template source modifications in this milestone — scaffold, configure, verify only.
- All commands run from `/Users/enriquefernandez/AI-dev/JoneyAI-4` unless stated.

---

### Task 1: Scaffold the chat template into the repo root

**Files:**
- Create: entire template tree at repo root (`package.json`, `app/`, `server/`, `actions/`, `agent-native.config.ts`, `.env.example`, `.gitignore`, ...)

**Interfaces:**
- Produces: installed app where `pnpm dev` starts the dev server on `http://localhost:8080` (Tasks 2-4 depend on this tree existing at the root).

- [ ] **Step 1: Scaffold with the official CLI** (the CLI creates a named subfolder; we scaffold into `joney-ai/` first)

```bash
cd /Users/enriquefernandez/AI-dev/JoneyAI-4
npx @agent-native/core@latest create joney-ai --standalone --template chat
```

Note: `--standalone` is the template README's documented invocation; it makes the app self-contained (own Better Auth) rather than tied to the Builder platform — correct for an eventual external product. If the CLI prompts interactively, accept defaults matching: template=chat, standalone=yes. If the CLI errors on an unknown flag, re-run as `npx @agent-native/core@latest create joney-ai --template chat` and note the deviation.

- [ ] **Step 2: Move the scaffolded tree up to the repo root** (includes dotfiles; guard against clobbering)

```bash
cd /Users/enriquefernandez/AI-dev/JoneyAI-4
ls -A            # confirm only "joney-ai" exists at root before moving
mv joney-ai/* joney-ai/.[!.]* .
rmdir joney-ai
ls -A            # confirm package.json, app/, server/, .env.example, .gitignore at root
```

If the CLI already initialized a git repo inside `joney-ai/`, the `.git` folder moves up with this step — that is fine; Task 3 handles git either way.

- [ ] **Step 3: Install dependencies**

```bash
pnpm install
```

Expected: install completes without errors (warnings acceptable). If `node-pty` build fails, run `xcode-select --install` first, then retry.

- [ ] **Step 4: Sanity-check the scaffold**

```bash
node -e "const p=require('./package.json'); console.log(p.name, p.scripts.dev)"
```

Expected: prints the app name and a dev script (`agent-native dev --open` or similar).

---

### Task 2: Configure environment (OpenAI + local dev)

**Files:**
- Create: `.env` (from `.env.example`)
- Read: `.gitignore` (verify `.env` is ignored)

**Interfaces:**
- Consumes: scaffolded tree from Task 1.
- Produces: `.env` containing `OPENAI_API_KEY`, which the agent runtime reads to power chat (Task 4 depends on it).

- [ ] **Step 1: Create `.env` from the template's example**

```bash
cp .env.example .env
```

- [ ] **Step 2: Append the OpenAI key placeholder**

Append to `.env`:

```bash
# AI provider (milestone 1: OpenAI)
OPENAI_API_KEY=
```

- [ ] **Step 3: Ask Enrique to paste their OpenAI API key into `.env`**

Ask the user to edit `.env` and set `OPENAI_API_KEY=sk-...` themselves (do not have them paste the key into the chat). Wait for confirmation before Task 4. Verify presence without printing the value:

```bash
grep -c "^OPENAI_API_KEY=sk" .env   # expected: 1
```

- [ ] **Step 4: Verify `.env` is gitignored**

```bash
grep -n "^\.env" .gitignore
```

Expected: a line matching `.env`. If missing, add `.env` to `.gitignore` before Task 3's commit.

---

### Task 3: Initialize git and make the initial commit

**Files:**
- Create: `.git/` (if the CLI did not already create it)

**Interfaces:**
- Consumes: scaffolded + configured tree from Tasks 1-2.
- Produces: a clean `main` branch baseline for all future feature branches.

- [ ] **Step 1: Initialize the repo (skip if `.git` already exists)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || git init -b main
```

- [ ] **Step 2: Verify no secrets are staged**

```bash
git add -A
git status --short | grep -E "\.env$" && echo "STOP: .env staged" || echo "OK: .env not staged"
```

Expected: `OK: .env not staged`. If `.env` appears, fix `.gitignore`, `git rm --cached .env`, re-check.

- [ ] **Step 3: Initial commit**

```bash
git commit -m "chore: scaffold agent-native chat template (joney-ai milestone 1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Run and verify the chat end-to-end

**Files:**
- None modified (verification only; local SQLite files appear under `data/`, which the template gitignores).

**Interfaces:**
- Consumes: running app from Tasks 1-3 with `OPENAI_API_KEY` set.
- Produces: verified success criteria for milestone 1.

- [ ] **Step 1: Static checks pass**

```bash
pnpm typecheck
pnpm test
```

Expected: typecheck clean; tests pass (template ships `--passWithNoTests`).

- [ ] **Step 2: Start the dev server (background)**

```bash
pnpm dev
```

Expected: server ready at `http://localhost:8080` (the script may auto-open a browser tab).

- [ ] **Step 3: Complete first-run setup in the browser**

Open `http://localhost:8080` (use Claude-in-Chrome tools to drive/verify). The template shows a Setup checklist in the agent sidebar; only "Connect an AI engine" is required. With `OPENAI_API_KEY` already in `.env`, the LLM step should be satisfied or satisfiable by selecting OpenAI in Settings > Manage agent (Cmd+K > "Manage agent"). Create a local account if the auth screen appears (no email verification needed in dev).

- [ ] **Step 4: Verify a real chat round-trip**

Send "Hello, introduce yourself" in the chat UI. Expected: a streamed OpenAI-powered response appears and the thread persists in the left sidebar after a page reload. If the agent responds with a not-configured message, open Settings > Manage agent and select the OpenAI provider/model, then retry.

- [ ] **Step 5: Report results to Enrique**

Summarize: what runs where, how to start/stop it (`pnpm dev`), where the key lives (`.env`), and confirm milestone 1 success criteria are met. No commit needed (no file changes in this task).

---

## Verification (end-to-end definition of done)

1. `pnpm typecheck` and `pnpm test` pass.
2. `pnpm dev` serves the app at `http://localhost:8080`.
3. A message sent in the chat UI returns a real OpenAI-generated response (verified in the browser).
4. Chat threads persist across a page reload (SQLite-backed).
5. `git log` shows the initial commit; `git status` is clean apart from gitignored files; `.env` is not tracked.

## Vercel considerations (decisions taken now so deployment stays easy later)

- **Server:** the template's Nitro backend is deploy-anywhere; Vercel is a supported Nitro preset (`NITRO_PRESET`/auto-detected). No change needed now — just avoid adding server code that assumes a long-lived local process or local filesystem writes.
- **Database:** local dev uses a SQLite file in `data/` via `@libsql/client`. That client speaks to **Turso / remote libsql** with only a `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN`) change, which is the intended production path and works on Vercel serverless. So keeping the SQLite default now is the Vercel-compatible choice, not a dead end.
- **Auth:** standalone Better Auth needs a stable `BETTER_AUTH_SECRET` in production (per `.env.example`); `BETTER_AUTH_URL`/`APP_URL` are set at deploy time. Nothing to do now; keep auth enabled so the flows we build match production.
- **Housekeeping:** the template ships a `netlify.toml`; leave it for now (inert), remove it in the deployment milestone. The environment has `vercel:setup` / `vercel:deploy` skills for when we get there.

## Risks / fallbacks

- **CLI flag drift:** the framework is young; if `--standalone` or `--template chat` change, consult `npx @agent-native/core@latest create --help` and match intent (chat template, self-contained auth).
- **Provider not picked up from `.env`:** the in-app Settings > Manage agent flow is the documented fallback — it can save the key/provider itself.
- **Port 8080 in use:** set `PORT` in `.env` or stop the conflicting process.
