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

## Post-deploy checks

1. `/chat` and `/dispatch` load; sign-in works; session survives refresh.
2. Golden path in chat: message → agent reply → HTML artifact → preview drawer
   → gallery (scope / pin / delete).
3. No schema errors in Vercel function logs.
