# Joney Jr. — Personal Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every member creates, names, and grows a personal agent: birth ritual, visible curated private brain, skill capture, Telegram access.

**Architecture:** Persona and brain digest live as personal-scope agent resources (framework injects personal instructions every turn, so web and Telegram both get them for free). Structured brain entries live in a new `brain_entries` SQL table behind owner-scoped actions. UI is action-backed React Router pages in `apps/chat`.

**Tech Stack:** `@agent-native/core` 0.159.2 (defineAction, resources store, db schema helpers, agent-chat plugin), React Router, shadcn/ui + `@tabler/icons-react`, vitest (plugin-free server config).

**Spec:** `apps/chat/docs/superpowers/specs/2026-08-30-joney-jr-personal-agents-design.md`

## Global Constraints

- All work under `apps/chat/`; run commands from `apps/chat` (`cd apps/chat`).
- DB: only `@agent-native/core/db/schema` helpers + portable `drizzle-orm` operators. Never import from `drizzle-orm/sqlite-core` or `drizzle-orm/pg-core`.
- Every new migration entry carries a unique `name:` slug; never renumber existing ones.
- Data access via actions only; reads declare `http: { method: "GET" }`; frontend uses `useActionQuery` / `useActionMutation`. No new `/api/*` routes.
- All brain/persona rows and resources are scoped to `ctx.userEmail` (+ org); `visibility` stays `'private'`. Tests must prove cross-owner isolation.
- UI: shadcn/ui + `@tabler/icons-react` only. No sparkle/wand/magic/robot icons for AI. Page/section loads use `Skeleton` with layout-matching geometry, never "Loading...".
- Verify every write by re-reading before reporting success.
- Verbatim persona resource path: `instructions/personal-agent.md`. Verbatim digest resource path: `instructions/personal-brain.md`. Both personal scope (owner = user email).
- Before claiming any task done: `pnpm typecheck && pnpm test` green from `apps/chat`.
- Final gate additionally requires `pnpm agent-native:doctor` clean.
- When a framework import in this plan doesn't resolve exactly as written, look it up with `pnpm action docs-search --query "<symbol>"` or `pnpm action source-search --query "<symbol>"` and adjust the import, not the design.

---

### Task 1: Brain store (schema, migration, scoped CRUD, digest sync)

**Files:**
- Create: `apps/chat/server/lib/brain-store.ts`
- Test: `apps/chat/tests/brain-store.test.ts`

**Interfaces:**
- Consumes: `@agent-native/core/db` (`getDb`, `runMigrations`), `@agent-native/core/db/schema` (`table`, `text`, `integer`, `now`), `@agent-native/core/resources/store` (`resourcePut`).
- Produces (used by Tasks 2–4):
  - `type BrainEntry = { id: string; ownerEmail: string; orgId: string | null; visibility: string; type: "fact" | "preference" | "lesson" | "note"; title: string; body: string; sourceThreadId: string | null; status: "proposed" | "kept"; promotable: boolean; createdAt: string; updatedAt: string }`
  - `ensureBrainTables(): Promise<void>`
  - `createBrainEntry(owner: { email: string; orgId: string | null }, input: { type: BrainEntry["type"]; title: string; body: string; sourceThreadId?: string | null; status: BrainEntry["status"] }): Promise<BrainEntry>`
  - `listBrainEntries(owner, filter?: { type?: BrainEntry["type"]; status?: BrainEntry["status"]; query?: string; limit?: number }): Promise<BrainEntry[]>`
  - `getBrainEntry(owner, id: string): Promise<BrainEntry | null>` (null when not owner's)
  - `updateBrainEntry(owner, id, patch: Partial<Pick<BrainEntry, "type" | "title" | "body" | "status">>): Promise<BrainEntry | null>`
  - `deleteBrainEntry(owner, id): Promise<boolean>`
  - `syncBrainDigest(owner): Promise<void>` — regenerates the personal digest resource from kept entries.

- [ ] **Step 1: Verify framework import names**

Run: `pnpm action docs-search --slug database` and `pnpm action source-search --query "runMigrations"`
Confirm the exact exports for `getDb`/`runMigrations` and the schema helpers. Adjust imports below if the docs differ.

- [ ] **Step 2: Write the failing test**

`apps/chat/tests/brain-store.test.ts`:

```ts
import { runWithRequestContext } from "@agent-native/core/server";
import { resourceGetByPath } from "@agent-native/core/resources/store";
import { beforeAll, describe, expect, it } from "vitest";

import {
  createBrainEntry,
  deleteBrainEntry,
  ensureBrainTables,
  getBrainEntry,
  listBrainEntries,
  syncBrainDigest,
  updateBrainEntry,
} from "../server/lib/brain-store";

const ana = { email: "ana@example.com", orgId: "org-1" };
const bob = { email: "bob@example.com", orgId: "org-1" };

describe("brain-store", () => {
  beforeAll(async () => {
    await ensureBrainTables();
  });

  it("creates and lists entries for the owner only", async () => {
    const entry = await createBrainEntry(ana, {
      type: "preference",
      title: "Brief style",
      body: "Prefers short bullet briefs",
      status: "kept",
    });
    expect(entry.visibility).toBe("private");
    expect(entry.status).toBe("kept");

    const anaList = await listBrainEntries(ana);
    expect(anaList.some((e) => e.id === entry.id)).toBe(true);

    const bobList = await listBrainEntries(bob);
    expect(bobList.some((e) => e.id === entry.id)).toBe(false);
    expect(await getBrainEntry(bob, entry.id)).toBeNull();
  });

  it("updates status proposed -> kept and deletes", async () => {
    const p = await createBrainEntry(ana, {
      type: "fact",
      title: "Runs paid media",
      body: "Ana owns the paid media budget",
      status: "proposed",
    });
    const kept = await updateBrainEntry(ana, p.id, { status: "kept" });
    expect(kept?.status).toBe("kept");
    expect(await updateBrainEntry(bob, p.id, { status: "kept" })).toBeNull();
    expect(await deleteBrainEntry(bob, p.id)).toBe(false);
    expect(await deleteBrainEntry(ana, p.id)).toBe(true);
  });

  it("filters by type/status and searches", async () => {
    await createBrainEntry(ana, {
      type: "lesson",
      title: "Q3 launch lesson",
      body: "Always confirm tracking pixels before launch",
      status: "kept",
    });
    const lessons = await listBrainEntries(ana, { type: "lesson", status: "kept" });
    expect(lessons.length).toBeGreaterThan(0);
    const hits = await listBrainEntries(ana, { query: "tracking pixels" });
    expect(hits.some((e) => e.title === "Q3 launch lesson")).toBe(true);
  });

  it("syncBrainDigest writes the personal digest resource", async () => {
    await syncBrainDigest(ana);
    await runWithRequestContext({ userEmail: ana.email }, async () => {
      const digest = await resourceGetByPath(ana.email, "instructions/personal-brain.md");
      expect(digest).not.toBeNull();
      expect(String(digest?.content ?? "")).toContain("Brief style");
    });
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm vitest run tests/brain-store.test.ts --config vitest.server.config.ts`
Expected: FAIL — module `../server/lib/brain-store` not found.

- [ ] **Step 4: Implement `server/lib/brain-store.ts`**

```ts
/**
 * Private brain entries for the member's personal agent. Every read/write is
 * scoped to the owner; visibility stays 'private' in MVP. The compact digest
 * of kept entries is mirrored into a personal instructions resource so the
 * agent carries it on every turn (web and Telegram alike).
 */
import { getDb, runMigrations } from "@agent-native/core/db";
import { integer, now, table, text } from "@agent-native/core/db/schema";
import { resourcePut } from "@agent-native/core/resources/store";
import { and, desc, eq, like, or } from "drizzle-orm";

export const brainEntries = table("brain_entries", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  visibility: text("visibility").notNull().default("private"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sourceThreadId: text("source_thread_id"),
  status: text("status").notNull().default("proposed"),
  promotable: integer("promotable", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
});

export type BrainEntry = typeof brainEntries.$inferSelect;
export type BrainOwner = { email: string; orgId: string | null };

let ensured = false;
export async function ensureBrainTables(): Promise<void> {
  if (ensured) return;
  await runMigrations([
    {
      version: 1,
      name: "joney-brain-entries-table",
      sql: `CREATE TABLE IF NOT EXISTS brain_entries (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        org_id TEXT,
        visibility TEXT NOT NULL DEFAULT 'private',
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        source_thread_id TEXT,
        status TEXT NOT NULL DEFAULT 'proposed',
        promotable INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS brain_entries_owner_idx
        ON brain_entries (owner_email, status, updated_at);`,
    },
  ]);
  ensured = true;
}
```

(If `runMigrations` takes a different options shape per Step 1's docs check, keep the `name:` slug and the DDL, adapt the wrapper.)

Continue the file:

```ts
function ownerFilter(owner: BrainOwner) {
  return owner.orgId
    ? and(eq(brainEntries.ownerEmail, owner.email), eq(brainEntries.orgId, owner.orgId))
    : eq(brainEntries.ownerEmail, owner.email);
}

export async function createBrainEntry(
  owner: BrainOwner,
  input: {
    type: string;
    title: string;
    body: string;
    sourceThreadId?: string | null;
    status: "proposed" | "kept";
  },
): Promise<BrainEntry> {
  await ensureBrainTables();
  const db = getDb();
  const nowIso = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    ownerEmail: owner.email,
    orgId: owner.orgId,
    visibility: "private",
    type: input.type,
    title: input.title,
    body: input.body,
    sourceThreadId: input.sourceThreadId ?? null,
    status: input.status,
    promotable: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  await db.insert(brainEntries).values(row);
  const [saved] = await db
    .select()
    .from(brainEntries)
    .where(and(ownerFilter(owner), eq(brainEntries.id, row.id)));
  if (!saved) throw new Error("brain entry write could not be verified");
  return saved;
}

export async function listBrainEntries(
  owner: BrainOwner,
  filter: { type?: string; status?: string; query?: string; limit?: number } = {},
): Promise<BrainEntry[]> {
  await ensureBrainTables();
  const db = getDb();
  const clauses = [ownerFilter(owner)];
  if (filter.type) clauses.push(eq(brainEntries.type, filter.type));
  if (filter.status) clauses.push(eq(brainEntries.status, filter.status));
  if (filter.query) {
    const q = `%${filter.query.replace(/[%_]/g, "")}%`;
    clauses.push(or(like(brainEntries.title, q), like(brainEntries.body, q))!);
  }
  return db
    .select()
    .from(brainEntries)
    .where(and(...clauses))
    .orderBy(desc(brainEntries.updatedAt))
    .limit(filter.limit ?? 200);
}

export async function getBrainEntry(owner: BrainOwner, id: string) {
  await ensureBrainTables();
  const db = getDb();
  const [row] = await db
    .select()
    .from(brainEntries)
    .where(and(ownerFilter(owner), eq(brainEntries.id, id)));
  return row ?? null;
}

export async function updateBrainEntry(
  owner: BrainOwner,
  id: string,
  patch: Partial<{ type: string; title: string; body: string; status: string }>,
): Promise<BrainEntry | null> {
  await ensureBrainTables();
  const existing = await getBrainEntry(owner, id);
  if (!existing) return null;
  const db = getDb();
  await db
    .update(brainEntries)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(and(ownerFilter(owner), eq(brainEntries.id, id)));
  return getBrainEntry(owner, id);
}

export async function deleteBrainEntry(owner: BrainOwner, id: string): Promise<boolean> {
  await ensureBrainTables();
  const existing = await getBrainEntry(owner, id);
  if (!existing) return false;
  const db = getDb();
  await db.delete(brainEntries).where(and(ownerFilter(owner), eq(brainEntries.id, id)));
  return (await getBrainEntry(owner, id)) === null;
}
```

Digest sync (cap: all kept preferences + 20 most recent other kept entries, bodies truncated to 200 chars):

```ts
const DIGEST_PATH = "instructions/personal-brain.md";

export async function syncBrainDigest(owner: BrainOwner): Promise<void> {
  const prefs = await listBrainEntries(owner, { type: "preference", status: "kept" });
  const others = (await listBrainEntries(owner, { status: "kept", limit: 60 }))
    .filter((e) => e.type !== "preference")
    .slice(0, 20);
  const line = (e: BrainEntry) =>
    `- [${e.type}] ${e.title}: ${e.body.length > 200 ? `${e.body.slice(0, 200)}…` : e.body}`;
  const content = [
    "# Personal brain digest (auto-generated — edit via My Brain, not here)",
    "",
    "What this member's agent should remember:",
    ...prefs.map(line),
    ...others.map(line),
    "",
    "Use search-brain for anything not listed here.",
  ].join("\n");
  await resourcePut(owner.email, DIGEST_PATH, content, "text/markdown");
}
```

(If `resourcePut` needs request context for personal scope, wrap the call sites — the actions in Task 2 already run inside one; for the test, `runWithRequestContext` is shown.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/brain-store.test.ts --config vitest.server.config.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add server/lib/brain-store.ts tests/brain-store.test.ts
git commit -m "feat(joney-jr): brain store — scoped entries table + personal digest sync"
```

---

### Task 2: Brain CRUD actions

**Files:**
- Create: `apps/chat/actions/list-brain-entries.ts`
- Create: `apps/chat/actions/save-brain-entry.ts`
- Create: `apps/chat/actions/update-brain-entry.ts`
- Create: `apps/chat/actions/delete-brain-entry.ts`
- Create: `apps/chat/actions/search-brain.ts`
- Create: `apps/chat/server/lib/brain-owner.ts`
- Test: `apps/chat/tests/brain-actions.test.ts`

**Interfaces:**
- Consumes: Task 1's store functions; `defineAction` from `@agent-native/core/action`; org id from the action run context.
- Produces: actions callable by agent and `useActionQuery`/`useActionMutation`:
  - `list-brain-entries` (GET) `{ type?, status?, query? }` → `{ entries: BrainEntry[] }`
  - `save-brain-entry` `{ type, title, body }` → `{ saved: true, entry }` (status `kept`; user-authored)
  - `update-brain-entry` `{ id, type?, title?, body?, status? }` → `{ updated: true, entry }`
  - `delete-brain-entry` `{ id }` → `{ deleted: true }`
  - `search-brain` (GET) `{ query }` → `{ entries }` (agent retrieval beyond digest)
- `brain-owner.ts` produces `ownerFromCtx(ctx): { email: string; orgId: string | null }` (throws if no user).

- [ ] **Step 1: Check how actions read orgId**

Run: `pnpm action docs-search --slug actions-run-context`
Confirm the ctx field for org (expected `ctx.orgId` or via `getOrgContext`). Implement `brain-owner.ts` accordingly:

```ts
export function ownerFromCtx(ctx: { userEmail?: string | null; orgId?: string | null } | undefined) {
  const email = ctx?.userEmail?.trim().toLowerCase();
  if (!email) throw new Error("This action requires a signed-in user");
  return { email, orgId: ctx?.orgId ?? null };
}
```

- [ ] **Step 2: Write the failing tests**

`apps/chat/tests/brain-actions.test.ts` (mirror the harness in `tests/save-artifact-action.test.ts`):

```ts
import { runWithRequestContext } from "@agent-native/core/server";
import { describe, expect, it } from "vitest";

import deleteBrainEntry from "../actions/delete-brain-entry";
import listBrainEntries from "../actions/list-brain-entries";
import saveBrainEntry from "../actions/save-brain-entry";
import searchBrain from "../actions/search-brain";
import updateBrainEntry from "../actions/update-brain-entry";

const asUser = (email: string, fn: () => Promise<void>) =>
  runWithRequestContext({ userEmail: email }, fn);

describe("brain actions", () => {
  it("save -> list -> update -> delete, owner-scoped end to end", async () => {
    let id = "";
    await asUser("carla@example.com", async () => {
      const res = (await saveBrainEntry.run(
        { type: "preference", title: "Tone", body: "Direct, no fluff" },
        {} as never,
      )) as { saved: true; entry: { id: string; status: string } };
      expect(res.entry.status).toBe("kept");
      id = res.entry.id;

      const list = (await listBrainEntries.run({}, {} as never)) as {
        entries: { id: string }[];
      };
      expect(list.entries.some((e) => e.id === id)).toBe(true);
    });

    await asUser("dave@example.com", async () => {
      const list = (await listBrainEntries.run({}, {} as never)) as {
        entries: { id: string }[];
      };
      expect(list.entries.some((e) => e.id === id)).toBe(false);
      await expect(
        updateBrainEntry.run({ id, title: "hijack" }, {} as never),
      ).rejects.toThrow();
      await expect(deleteBrainEntry.run({ id }, {} as never)).rejects.toThrow();
    });

    await asUser("carla@example.com", async () => {
      const hits = (await searchBrain.run({ query: "fluff" }, {} as never)) as {
        entries: { id: string }[];
      };
      expect(hits.entries.some((e) => e.id === id)).toBe(true);
      await updateBrainEntry.run({ id, body: "Direct. Bullets over prose." }, {} as never);
      const del = (await deleteBrainEntry.run({ id }, {} as never)) as { deleted: true };
      expect(del.deleted).toBe(true);
    });
  });

  it("rejects unauthenticated calls", async () => {
    await expect(
      saveBrainEntry.run({ type: "note", title: "x", body: "y" }, {} as never),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm vitest run tests/brain-actions.test.ts --config vitest.server.config.ts`
Expected: FAIL — action modules not found.

- [ ] **Step 4: Implement the five actions**

Pattern for each (shown for `save-brain-entry.ts`; others follow the same shape):

```ts
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { createBrainEntry, syncBrainDigest } from "../server/lib/brain-store";
import { ownerFromCtx } from "../server/lib/brain-owner";

const entryType = z.enum(["fact", "preference", "lesson", "note"]);

export default defineAction({
  description:
    "Save an entry the member explicitly wants in their private brain (status kept). For memories YOU infer from conversation, use propose-memory instead.",
  schema: z.object({
    type: entryType,
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(2000),
  }),
  http: false,
  run: async (input, ctx) => {
    const owner = ownerFromCtx(ctx);
    const entry = await createBrainEntry(owner, { ...input, status: "kept" });
    await syncBrainDigest(owner);
    return { saved: true as const, entry };
  },
});
```

- `list-brain-entries`: `http: { method: "GET" }`, schema `{ type?: entryType, status?: z.enum(["proposed","kept"]), query?: z.string().max(200) }`, returns `{ entries: await listBrainEntries(owner, input) }`.
- `search-brain`: `http: { method: "GET" }`, schema `{ query: z.string().min(2).max(200) }`, description "Search the member's private brain for memories beyond the always-loaded digest."
- `update-brain-entry`: schema `{ id: z.string(), type?: entryType, title?, body?, status?: z.enum(["proposed","kept"]) }`; call `updateBrainEntry`; if it returns null, `throw new Error("Entry not found")`; then `syncBrainDigest(owner)`; return `{ updated: true, entry }`.
- `delete-brain-entry`: schema `{ id }`; if `deleteBrainEntry` returns false, throw "Entry not found"; then `syncBrainDigest(owner)`; return `{ deleted: true }`.

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm vitest run tests/brain-actions.test.ts --config vitest.server.config.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck and commit**

```bash
pnpm typecheck
git add actions/*brain*.ts server/lib/brain-owner.ts tests/brain-actions.test.ts
git commit -m "feat(joney-jr): brain CRUD + search actions, owner-scoped"
```

---

### Task 3: Memory proposals — propose-memory, review-brain-entry, chat card

**Files:**
- Create: `apps/chat/actions/propose-memory.ts`
- Create: `apps/chat/actions/review-brain-entry.ts`
- Create: `apps/chat/app/lib/brain-proposal-renderer.ts`
- Create: `apps/chat/app/components/chat/BrainProposalCard.tsx`
- Modify: wherever `ARTIFACT_FILE_RENDERER` is registered (find with `rg -n "ARTIFACT_FILE_RENDERER" app/`) — register the new renderer the same way.
- Test: `apps/chat/tests/brain-proposal-actions.test.ts`

**Interfaces:**
- Consumes: Task 1 store, Task 2's `ownerFromCtx`.
- Produces:
  - `propose-memory` `{ type, title, body }` → `{ proposed: true, entry }` (status always `proposed`; `sourceThreadId` from `ctx.threadId`)
  - `review-brain-entry` `{ id, decision: "keep" | "dismiss" }` → `{ reviewed: true, decision, entry? }`
  - `BRAIN_PROPOSAL_RENDERER` — chat card renderer key, registered by tool name `propose-memory` so the card renders during streaming (same mechanism as the artifact card).

- [ ] **Step 1: Write the failing tests**

```ts
import { runWithRequestContext } from "@agent-native/core/server";
import { describe, expect, it } from "vitest";

import proposeMemory from "../actions/propose-memory";
import reviewBrainEntry from "../actions/review-brain-entry";
import listBrainEntries from "../actions/list-brain-entries";

const asUser = (email: string, fn: () => Promise<void>) =>
  runWithRequestContext({ userEmail: email }, fn);

describe("memory proposals", () => {
  it("propose creates proposed (never kept), keep transitions, dismiss deletes", async () => {
    await asUser("eva@example.com", async () => {
      const p1 = (await proposeMemory.run(
        { type: "preference", title: "Slides length", body: "Max 10 slides" },
        { threadId: "t-1" } as never,
      )) as { proposed: true; entry: { id: string; status: string; sourceThreadId: string | null } };
      expect(p1.entry.status).toBe("proposed");
      expect(p1.entry.sourceThreadId).toBe("t-1");

      const kept = (await reviewBrainEntry.run(
        { id: p1.entry.id, decision: "keep" },
        {} as never,
      )) as { reviewed: true; entry: { status: string } };
      expect(kept.entry.status).toBe("kept");

      const p2 = (await proposeMemory.run(
        { type: "note", title: "Junk", body: "Not worth keeping" },
        {} as never,
      )) as { proposed: true; entry: { id: string } };
      await reviewBrainEntry.run({ id: p2.entry.id, decision: "dismiss" }, {} as never);
      const list = (await listBrainEntries.run({ status: "proposed" }, {} as never)) as {
        entries: { id: string }[];
      };
      expect(list.entries.some((e) => e.id === p2.entry.id)).toBe(false);
    });
  });

  it("another user cannot review someone else's proposal", async () => {
    let id = "";
    await asUser("eva@example.com", async () => {
      const p = (await proposeMemory.run(
        { type: "fact", title: "Territory", body: "Covers LATAM" },
        {} as never,
      )) as { proposed: true; entry: { id: string } };
      id = p.entry.id;
    });
    await asUser("mallory@example.com", async () => {
      await expect(
        reviewBrainEntry.run({ id, decision: "keep" }, {} as never),
      ).rejects.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run to verify failure** — same vitest command pattern; expected FAIL (modules missing).

- [ ] **Step 3: Implement the two actions**

`propose-memory.ts`: same shape as `save-brain-entry` but `status: "proposed"`, `sourceThreadId: ctx?.threadId ?? null`, no digest sync (proposals don't enter the digest), and `chatUI: { renderer: BRAIN_PROPOSAL_RENDERER, title: "Memory proposed" }` where `BRAIN_PROPOSAL_RENDERER` is the string constant `"brain-proposal"` exported from `app/lib/brain-proposal-renderer.ts` (import type-only to avoid client code in server bundle — copy how `save-artifact.ts` imports `ARTIFACT_FILE_RENDERER`). Description: "Propose a durable memory for the member's private brain after a meaningful moment in conversation. The member must approve it — never present a proposal as saved. Propose sparingly: one clearly valuable memory beats five trivial ones."

`review-brain-entry.ts`: `decision === "keep"` → `updateBrainEntry(owner, id, { status: "kept" })` (throw "Entry not found" on null) then `syncBrainDigest(owner)`; `decision === "dismiss"` → `deleteBrainEntry` (throw on false). Return `{ reviewed: true, decision, entry }` (entry omitted on dismiss).

- [ ] **Step 4: Implement the chat card**

`app/lib/brain-proposal-renderer.ts`: export `const BRAIN_PROPOSAL_RENDERER = "brain-proposal"` and register a renderer for tool name `propose-memory` exactly the way the artifact renderer registers (find with `rg -n "registerToolRenderer|ARTIFACT_FILE_RENDERER" app/ --glob '!node_modules'`; copy that registration path). The renderer mounts `BrainProposalCard`.

`BrainProposalCard.tsx`: card showing type badge + title + body, two buttons: "Keep" (primary) and "Dismiss" (ghost), wired to `useActionMutation("review-brain-entry")`, invalidating query key `["action", "list-brain-entries"]` on success (match the invalidation idiom used elsewhere in the app — `rg -n "invalidate" app/components/chat/`). While the tool result is still streaming, render the card with a `Skeleton` body. After review, show a quiet "Kept" / "Dismissed" state instead of the buttons.

- [ ] **Step 5: Run tests to verify pass; typecheck**

Run: `pnpm vitest run tests/brain-proposal-actions.test.ts --config vitest.server.config.ts && pnpm typecheck`
Expected: PASS, clean typecheck.

- [ ] **Step 6: Commit**

```bash
git add actions/propose-memory.ts actions/review-brain-entry.ts app/lib/brain-proposal-renderer.ts app/components/chat/BrainProposalCard.tsx tests/brain-proposal-actions.test.ts
git commit -m "feat(joney-jr): memory proposals with in-chat keep/dismiss card"
```

---

### Task 4: Persona store + get/create-personal-agent actions

**Files:**
- Create: `apps/chat/server/lib/persona-store.ts`
- Create: `apps/chat/actions/get-personal-agent.ts`
- Create: `apps/chat/actions/create-personal-agent.ts`
- Test: `apps/chat/tests/personal-agent-actions.test.ts`

**Interfaces:**
- Consumes: `resourcePut`, `resourceGetByPath` from `@agent-native/core/resources/store`; `ownerFromCtx`; Task 1's `createBrainEntry` (for role-fact proposals).
- Produces:
  - `type PersonaProfile = { name: string; createdAt: string; persona: string }`
  - `readPersona(ownerEmail: string): Promise<PersonaProfile | null>`
  - `writePersona(ownerEmail: string, profile: { name: string; persona: string }): Promise<PersonaProfile>`
  - `get-personal-agent` (GET) `{}` → `{ exists: boolean; name?: string; createdAt?: string }`
  - `create-personal-agent` `{ name, persona, roleFacts? }` → `{ created: true, name }` — used by the agent during the birth ritual; `roleFacts` become `proposed` brain entries.
- Scope note: the spec's optional *manager* pre-seeding (staging role facts before the member's first login) is deliberately deferred — entries are member-owned and the ritual's `roleFacts` covers the need for the pilot. Revisit in sub-project 2 alongside the promotion flow.

- [ ] **Step 1: Write the failing tests**

```ts
import { runWithRequestContext } from "@agent-native/core/server";
import { describe, expect, it } from "vitest";

import createPersonalAgent from "../actions/create-personal-agent";
import getPersonalAgent from "../actions/get-personal-agent";
import listBrainEntries from "../actions/list-brain-entries";

const asUser = (email: string, fn: () => Promise<void>) =>
  runWithRequestContext({ userEmail: email }, fn);

describe("personal agent", () => {
  it("does not exist before the ritual", async () => {
    await asUser("fresh@example.com", async () => {
      const res = (await getPersonalAgent.run({}, {} as never)) as { exists: boolean };
      expect(res.exists).toBe(false);
    });
  });

  it("create writes persona; get returns it; role facts land as proposals", async () => {
    await asUser("gina@example.com", async () => {
      await createPersonalAgent.run(
        {
          name: "Max",
          persona: "Direct and warm. Gina runs customer marketing for LATAM.",
          roleFacts: [{ title: "Role", body: "Head of customer marketing, LATAM" }],
        },
        {} as never,
      );
      const res = (await getPersonalAgent.run({}, {} as never)) as {
        exists: boolean;
        name?: string;
      };
      expect(res).toMatchObject({ exists: true, name: "Max" });

      const proposals = (await listBrainEntries.run({ status: "proposed" }, {} as never)) as {
        entries: { title: string }[];
      };
      expect(proposals.entries.some((e) => e.title === "Role")).toBe(true);
    });
  });

  it("personas are per-user", async () => {
    await asUser("hank@example.com", async () => {
      const res = (await getPersonalAgent.run({}, {} as never)) as { exists: boolean };
      expect(res.exists).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run to verify failure.** Expected: FAIL, modules missing.

- [ ] **Step 3: Implement `persona-store.ts`**

Resource path constant `PERSONA_PATH = "instructions/personal-agent.md"`, personal owner = user email. Serialize as:

```markdown
<!-- joney-agent name="Max" created="2026-08-30T10:00:00.000Z" -->
# Max — this member's personal agent

You are Max, this member's personal agent. Always act with this persona:

Direct and warm. Gina runs customer marketing for LATAM.
```

`writePersona` builds that string and `resourcePut(ownerEmail, PERSONA_PATH, content, "text/markdown")`, then re-reads via `resourceGetByPath(ownerEmail, PERSONA_PATH)` to verify. `readPersona` parses the `<!-- joney-agent ... -->` comment with `/<!-- joney-agent name="([^"]*)" created="([^"]*)" -->/` and returns null when the resource is missing or the marker doesn't parse.

- [ ] **Step 4: Implement the two actions**

`get-personal-agent.ts`: `http: { method: "GET" }`, empty object schema, returns `{ exists: false }` or `{ exists: true, name, createdAt }`. Description: "Check whether this member has created their personal agent, and get its name."

`create-personal-agent.ts`: schema `{ name: z.string().min(1).max(40), persona: z.string().min(10).max(2000), roleFacts: z.array(z.object({ title: z.string().max(120), body: z.string().max(500) })).max(10).optional() }`. Writes persona; each roleFact becomes `createBrainEntry(owner, { type: "fact", title, body, status: "proposed" })`. Description: "Create the member's personal agent at the end of the birth ritual. Call once, with the member's chosen name and the persona summary they agreed to. Role facts you learned go in roleFacts — they become proposals the member confirms."

- [ ] **Step 5: Run tests; expect PASS. Typecheck.**

- [ ] **Step 6: Commit**

```bash
git add server/lib/persona-store.ts actions/get-personal-agent.ts actions/create-personal-agent.ts tests/personal-agent-actions.test.ts
git commit -m "feat(joney-jr): persona store + personal agent create/get actions"
```

---

### Task 5: System prompt — ritual protocol, memory norms, skill offers

**Files:**
- Modify: `apps/chat/server/plugins/agent-chat.ts` (the `systemPrompt` string, lines 22–30)

**Interfaces:**
- Consumes: action names from Tasks 2–4 (must match exactly: `propose-memory`, `review-brain-entry`, `save-brain-entry`, `search-brain`, `create-personal-agent`, `get-personal-agent`).
- Produces: prompt contract the ritual UI (Task 6) relies on — the hidden context marker string `[joney-ritual]`.

- [ ] **Step 1: Append to the systemPrompt (keep every existing paragraph unchanged)**

Add these paragraphs to the template literal:

```text
You are each member's PERSONAL agent. A personal-agent persona (instructions/personal-agent.md) and a private brain digest (instructions/personal-brain.md) may be present in your context — embody the persona (its name is your name) and treat the digest as what you remember about this member. Their brain is private to them.

Birth ritual: when a message contains the marker [joney-ritual], the member is creating you. Run a short, warm conversation — one question at a time: (1) what name should they give you, (2) what do they work on (role, team, what they're responsible for), (3) how should you communicate (tone, format preferences). Keep it under ~6 exchanges. Then summarize the persona in 2-3 sentences, confirm it with them, and call create-personal-agent with the chosen name, the confirmed persona, and any role facts you learned as roleFacts. After it succeeds, greet them by your new name and suggest one concrete thing you can help with this week.

Memory: when a conversation produces something durably worth remembering (a stable preference, a fact about their role or team, a lesson from work that went well or badly), call propose-memory — sparingly, one clearly valuable memory beats five trivial ones. Never claim you saved a memory; the member approves proposals. When they ask you to remember something explicitly, use save-brain-entry (that one is immediate). Use search-brain when you need more than the digest shows.

Skills: when a conversation just produced a repeatable, successful workflow the member seems likely to want again, offer once — "want me to save this as a skill you can reuse?" — and if they agree, follow the turn-into-skill flow to save it as their personal skill. Do not offer after trivial exchanges.
```

- [ ] **Step 2: Verify prompt builds and existing behavior intact**

Run: `pnpm typecheck && pnpm test`
Expected: clean; all existing tests still pass (the prompt is data, but the test suite guards the plugin module loads).

- [ ] **Step 3: Commit**

```bash
git add server/plugins/agent-chat.ts
git commit -m "feat(joney-jr): system prompt — birth ritual, memory norms, skill offers"
```

---

### Task 6: Welcome screen + birth ritual gate

**Files:**
- Create: `apps/chat/app/components/chat/WelcomeCreateAgent.tsx`
- Modify: `apps/chat/app/routes/_index.tsx` (gate before `AgentChatSurface`)
- Test: `apps/chat/tests/welcome-create-agent.test.tsx`

**Interfaces:**
- Consumes: `get-personal-agent` via `useActionQuery`; `sendToAgentChat` from the core client (verify import path with `pnpm action docs-search --query "sendToAgentChat"`); the `[joney-ritual]` marker from Task 5.
- Produces: first-run gate — members without an agent see the welcome screen; after the ritual completes, the normal chat renders and the header shows the agent's name.

- [ ] **Step 1: Write the failing component test**

Mirror the setup style of `tests/theme-toggle.test.tsx` (jsdom + testing-library; check its imports and copy the harness). Test cases:

```tsx
// 1. renders the welcome CTA when get-personal-agent returns { exists: false }
// 2. renders nothing (returns null) when { exists: true }
// 3. clicking "Create your agent" calls sendToAgentChat with a message
//    containing "[joney-ritual]" and submit: true
```

Mock `useActionQuery` and `sendToAgentChat` with `vi.mock` on their real module paths (as discovered in Step 1's docs check — pin the exact specifier in the test).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement `WelcomeCreateAgent.tsx`**

Content requirements:
- Full-height centered panel replacing the chat surface. One primary action only: button "Create your agent".
- Copy (verbatim): heading "Meet your agent"; body "Before anything else, create your personal agent. Give it a name, tell it what you work on, and shape how it talks to you. It's yours: what it learns stays private to you."
- While `useActionQuery("get-personal-agent")` is loading: `Skeleton` blocks matching the panel geometry (heading bar + two text lines + button), never a "Loading..." string.
- On click: `sendToAgentChat({ message: "[joney-ritual] I want to create my personal agent.", submit: true })`, then rely on the live thread; when `get-personal-agent` refetches as `exists: true` (invalidate on window focus + after mutation settle — reuse the app's query invalidation idiom), the gate unmounts.
- Icon: `IconUserBolt` or similar from `@tabler/icons-react` — no sparkles/wands/robots.

- [ ] **Step 4: Wire the gate in `_index.tsx`**

Inside `ChatRoute`, query `get-personal-agent`; when not `exists` and not on an existing thread URL, render `WelcomeCreateAgent` INSTEAD of `AgentChatSurface` — except while a ritual thread is active (after the CTA fired, show the chat so the ritual conversation is visible; simplest: gate only when `exists === false` AND no `threadId` param AND the user hasn't clicked yet this session — keep a `useState` flag in the route).

- [ ] **Step 5: Run tests; expect PASS. Typecheck.**

- [ ] **Step 6: Commit**

```bash
git add app/components/chat/WelcomeCreateAgent.tsx app/routes/_index.tsx tests/welcome-create-agent.test.tsx
git commit -m "feat(joney-jr): welcome gate + birth ritual entry"
```

---

### Task 7: My Brain page

**Files:**
- Create: `apps/chat/app/routes/brain.tsx`
- Create: `apps/chat/app/components/brain/BrainEntryCard.tsx`
- Create: `apps/chat/app/components/brain/ProposalsInbox.tsx`
- Modify: the app nav (find it: `rg -n "artifacts" app/components/layout/ -l` — add a "My Brain" link beside the Artifacts link, `IconBrain` from tabler)
- Test: `apps/chat/tests/brain-page.test.tsx`

**Interfaces:**
- Consumes: `list-brain-entries`, `update-brain-entry`, `delete-brain-entry`, `review-brain-entry` via action hooks.
- Produces: route `/brain`.

- [ ] **Step 1: Write the failing component test** — render the page with mocked `useActionQuery` returning: 2 proposed entries + 3 kept entries across types. Assert: proposals inbox section renders with Keep/Dismiss buttons; kept entries grouped under type headings ("Preferences", "Facts", "Lessons", "Notes"); empty state (no entries at all) shows the copy "Your brain is empty so far. Chat with your agent — it will propose memories worth keeping." (verbatim).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement**

- `brain.tsx`: page title "My Brain"; loads `list-brain-entries` (no filter) once, partitions client-side. Loading state: `Skeleton` rows matching card geometry. Order: ProposalsInbox on top (only when proposals exist), then kept sections by type.
- `ProposalsInbox.tsx`: list of proposed entries, each with Keep (primary) / Dismiss (ghost) via `useActionMutation("review-brain-entry")`, invalidating `list-brain-entries` on settle.
- `BrainEntryCard.tsx`: type badge, title, body, inline edit (pencil icon → title/body inputs → save via `update-brain-entry`), delete with a confirm `AlertDialog` ("Delete this memory? Your agent will forget it.") via `delete-brain-entry`.
- Nav link added where the artifacts link lives.

- [ ] **Step 4: Run tests; expect PASS. Typecheck.**

- [ ] **Step 5: Commit**

```bash
git add app/routes/brain.tsx app/components/brain/ tests/brain-page.test.tsx
git commit -m "feat(joney-jr): My Brain page — proposals inbox + curated entries"
```

---

### Task 8: Agent name in chrome + Save-as-skill affordance

**Files:**
- Modify: the chat header/sidebar component that currently shows the app title (find: `rg -n "APP_TITLE" app/ -l`) — when `get-personal-agent` returns a name, display the agent name (e.g. "Max") in the chat surface header area; fall back to the app title before the ritual.
- Create: `apps/chat/app/components/chat/SaveAsSkillButton.tsx`
- Modify: the thread view (in `app/routes/chat.$threadId.tsx` or the shared chat chrome — whichever renders per-thread controls; locate via `rg -n "threadUrlSync" app/`) to mount the button.
- Test: `apps/chat/tests/save-as-skill-button.test.tsx`

**Interfaces:**
- Consumes: `get-personal-agent`; `sendToAgentChat` (same import as Task 6).
- Produces: a per-thread "Save as skill" control.

- [ ] **Step 1: Write the failing test** — button renders with label "Save as skill"; clicking calls `sendToAgentChat` with `submit: true` and a message containing "turn-into-skill" and asking to capture THIS conversation as a reusable personal skill.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement**

`SaveAsSkillButton.tsx`: ghost button, `IconBookmarkPlus`, label "Save as skill"; on click `sendToAgentChat({ message: "Use turn-into-skill to capture this conversation's workflow as a reusable personal skill. Name it in plain language and confirm the name with me first.", submit: true })`. Mount it in the thread header/toolbar (only on thread routes, not the empty home). Label it as a local action per workspace rules? No — it hands work to the agent, so it is an agent action and needs no "local" label; it must NOT use sparkle iconography.

Header name: small change where `APP_TITLE` renders in the chat chrome — `const { data } = useActionQuery("get-personal-agent", {})`; show `data?.name ?? APP_TITLE`.

- [ ] **Step 4: Run tests; expect PASS. Typecheck.**

- [ ] **Step 5: Commit**

```bash
git add app/components/chat/SaveAsSkillButton.tsx tests/save-as-skill-button.test.tsx
git add -u
git commit -m "feat(joney-jr): agent name in chrome + save-as-skill affordance"
```

---

### Task 9: Telegram — connect card + deployment runbook

**Files:**
- Create: `apps/chat/app/components/chat/ConnectTelegramCard.tsx`
- Modify: `apps/chat/app/routes/_index.tsx` (show the card once `get-personal-agent.exists` is true and it hasn't been dismissed — persist dismissal in `localStorage` key `joney.telegram-card.dismissed`, a UI-only preference, allowed)
- Modify: `DEPLOYMENT.md` (repo root) — add the Telegram section.
- Test: `apps/chat/tests/connect-telegram-card.test.tsx`

**Interfaces:**
- Consumes: nothing new server-side — MVP links to Dispatch's identities page (`/dispatch/identities`), which owns the link-token flow.
- Produces: user-visible path to the full Telegram loop.

- [ ] **Step 1: Write the failing test** — card renders heading "Talk to your agent in Telegram" with a link whose `href` is `/dispatch/identities` (relative link — never hardcode host/port); dismiss button hides it and writes the localStorage key; card does not render when the key is set.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement the card**

Compact banner-style card above the chat surface on the home route: heading "Talk to your agent in Telegram", body "Link your Telegram account and your agent — with everything it knows — answers you there too.", action button "Connect Telegram" → `/dispatch/identities` (relative), dismiss `IconX`.

- [ ] **Step 4: Write the deployment runbook section in `DEPLOYMENT.md`**

Add a "## Telegram channel" section with the exact production steps (operator = Enrique):
1. Create the bot with @BotFather; copy the token.
2. `vercel env add TELEGRAM_BOT_TOKEN production` (paste UNQUOTED — the local `.env` quoting gotcha), and `TELEGRAM_WEBHOOK_SECRET` = `openssl rand -hex 32`.
3. Redeploy, then register the webhook once: `curl -X POST https://joney-v4.vercel.app/chat/_agent-native/integrations/telegram/setup` (verify the exact mount path against `pnpm action docs-search --slug messaging` — base-path apps may prefix `/chat`; record the working command in the doc).
4. Each member: open `/dispatch/identities` → create link token → send `/link TOKEN` to the bot from Telegram.
5. Re-run the webhook registration after any deployment URL change.

- [ ] **Step 5: Run tests; expect PASS. Typecheck.**

- [ ] **Step 6: Commit**

```bash
git add app/components/chat/ConnectTelegramCard.tsx tests/connect-telegram-card.test.tsx ../../DEPLOYMENT.md
git add -u
git commit -m "feat(joney-jr): Telegram connect card + deployment runbook"
```

---

### Task 10: Full verification + golden path

**Files:** none new.

- [ ] **Step 1: Full suite from `apps/chat`**

Run: `pnpm typecheck && pnpm test && pnpm agent-native:doctor`
Expected: all green, doctor clean. Fix anything that isn't before proceeding.

- [ ] **Step 2: Manual golden path (local dev, `pnpm dev` from root, http://127.0.0.1:8080/chat)**

As a fresh user (invite or second test account):
1. Land on home → welcome screen with "Create your agent" (no chat surface).
2. Click → ritual conversation runs, one question at a time; agent calls `create-personal-agent`; greeting by new name arrives.
3. Header now shows the agent's name; welcome gate gone; role-fact proposals visible on /brain.
4. Chat something with a stable preference in it → a memory proposal card appears in chat → Keep → entry visible on /brain as kept; digest resource updated (check via agent: "what do you remember about me?").
5. Edit and delete an entry on /brain; confirm the agent's answers reflect it.
6. "Save as skill" on a thread → turn-into-skill flow completes → skill invocable in a new thread.
7. Second user: sees their own welcome screen; /brain shows nothing of user 1's.
8. Telegram card renders and dismisses; link flow deferred to production unless a local bot is configured.

- [ ] **Step 3: Commit any fixes; push**

```bash
git push origin main
```

Then production spot-check on https://joney-v4.vercel.app/chat (remember: hard-reload the tab after deploy — stale client JS has caused false "still broken" reports before).
