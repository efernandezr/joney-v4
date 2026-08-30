# Deployment — Vercel + Neon

Production topology: one Vercel project serving the whole workspace behind a
single origin (`/chat`, `/dispatch`), one Neon Postgres database shared by all
apps. Preview deploys use a separate Neon branch.

## Vercel project settings

- **Build command:** `npx @agent-native/core@latest deploy --preset vercel --build-only`
  (writes `.vercel/output` via the Build Output API; no `vercel.json` needed)
- **Install command:** `pnpm install`
- **Output:** Build Output API (auto-detected from `.vercel/output`)
- **Node:** 22.x

## Environment variables (Vercel → Settings → Environment Variables)

| Variable | Environments | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Production / Preview (different Neon branches) | `postgres://…neon.tech/…?sslmode=require` |
| `BETTER_AUTH_SECRET` | All | `openssl rand -hex 32`; hard-required in production |
| `OAUTH_STATE_SECRET` | All | `openssl rand -hex 32`; dedicated so auth-key rotation doesn't invalidate OAuth state |
| `A2A_SECRET` | All | `openssl rand -hex 32`; required for workspace app-to-app calls |
| `WORKSPACE_SECRETS_ENCRYPTION_KEY` | All | `openssl rand -hex 32`; encrypted-at-rest shared secrets vault |
| `OPENAI_API_KEY` | Production (+Preview if desired) | Agent engine key (company-paid deploy-level key) |
| `AUTO_CREATE_DEFAULT_ORG` | All | `0` — invite-only: no auto personal orgs (Stage 4) |
| `APP_URL` | Preview | Set on preview deploys where the request host is unreliable |

Generate every secret fresh with `openssl rand -hex 32`. Never commit values;
local shared values live in the root `.env` (gitignored), app-specific ones in
`apps/<app>/.env`.

## Database

- Production: Neon Postgres (main branch). Preview/staging: a second Neon
  branch with its own connection string.
- Release migrations run via `pnpm --filter chat migrate:production`
  (`apps/chat/scripts/migrate-production.ts`) — once per deploy, never on the
  request path. Verified against the Postgres dialect with PGlite.
- Local dev defaults to SQLite (`apps/chat/data/app.db`, shared across apps via
  the root `.env` `DATABASE_URL`). To develop against the Postgres dialect:
  `DATABASE_URL=pglite:./data/pglite` (PGlite is single-process — run vitest
  with `--no-file-parallelism` when pointing tests at it).

## Telegram channel

Members reach their personal agent from Telegram once this is wired up
(operator: Enrique).

1. Open Telegram and message **@BotFather**. Send `/newbot` and follow the
   prompts to name the bot. BotFather replies with an HTTP API token — copy
   it.
2. Set the two Telegram env vars on the Vercel project:
   ```bash
   vercel env add TELEGRAM_BOT_TOKEN production
   ```
   Paste the token **unquoted** at the prompt — the local `.env` quoting
   gotcha (wrapping the value in quotes) makes the literal quote characters
   part of the stored secret.
   ```bash
   openssl rand -hex 32 | vercel env add TELEGRAM_WEBHOOK_SECRET production
   ```
3. Redeploy, then register the webhook once. This workspace serves the chat
   app behind the shared origin at the `/chat` mount (see "Vercel project
   settings" above), so the chat app's `/_agent-native/integrations/*` routes
   are only reachable under that prefix — the bare `/_agent-native/...` path
   on this origin routes to the `dispatch` app instead. Verified against
   `@agent-native/core`'s Vercel deploy routing table
   (`deploy/workspace-deploy.js`, non-`dispatch` apps get
   `{ src: "/<app>/(.*)", dest: "/<app>-server" }`) and the `messaging` docs
   (`pnpm action docs-search --slug messaging`, which documents the generic
   single-app path `/_agent-native/integrations/telegram/setup`):
   ```bash
   curl -X POST https://joney-v4.vercel.app/chat/_agent-native/integrations/telegram/setup
   ```
   Run this once per deployment; it tells Telegram where to send messages.
4. Each member links their own Telegram account: open `/dispatch/identities`,
   create a link token, then send `/link TOKEN` to the bot from Telegram.
5. Re-run step 3's webhook registration any time the deployment URL changes
   (e.g. a new production domain), since Telegram keeps sending to the old
   URL until re-registered.

## Post-deploy checks

1. `/chat` and `/dispatch` load; sign-in works; session survives refresh.
2. Golden path in chat: message → agent reply → HTML artifact → preview drawer
   → gallery (scope / pin / delete).
3. No schema errors in Vercel function logs.
