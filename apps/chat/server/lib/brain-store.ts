/**
 * Private brain entries for the member's personal agent. Every read/write is
 * scoped to the owner; visibility stays 'private' in MVP. The compact digest
 * of kept entries is mirrored into a personal instructions resource so the
 * agent carries it on every turn (web and Telegram alike).
 */
import { createGetDb, runMigrations } from "@agent-native/core/db";
import { integer, now, table, text } from "@agent-native/core/db/schema";
import { resourcePut } from "@agent-native/core/resources/store";
import { and, desc, eq, like, ne, or } from "drizzle-orm";

export const brainEntries = table("brain_entries", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  visibility: text("visibility").notNull().default("private"),
  type: text("type", { enum: ["fact", "preference", "lesson", "note"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sourceThreadId: text("source_thread_id"),
  status: text("status", { enum: ["proposed", "kept"] }).notNull().default("proposed"),
  promotable: integer("promotable", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
});

export type BrainEntry = typeof brainEntries.$inferSelect;
export type BrainOwner = { email: string; orgId: string | null };

// `getDb` is not exported directly from `@agent-native/core/db` (that entry
// point only exports the generic, untyped `createDb`); every store builds
// its own lazy, singleton client via `createGetDb(schema)`. See
// core/dist/db/create-get-db.js and templates/brain/server/db/index.ts.
const getDb = createGetDb({ brainEntries });

// `runMigrations` requires a `table` bookkeeping option (a valid SQL
// identifier, unique per store so parallel migration runners on a shared
// database don't collide on version numbers) and returns a runner function
// rather than a promise — see core/dist/db/migrations.js.
//
// Exported as `runBrainMigrations` (mirroring the workspace's
// `runDispatchMigrations` convention — see apps/dispatch/scripts/
// migrate-production.ts) so scripts/migrate-production.ts can call it
// directly inside the same `withMigrationRuntime` block as the framework's
// own release migrations. On Vercel, `runMigrations`'s self-guard skips DDL
// in serverless request runtimes, so `ensureBrainTables()` below silently
// no-ops there — this table only ever gets created via the release script.
export const runBrainMigrations = runMigrations(
  [
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
  ],
  { table: "joney_brain_migrations" },
);

let ensured = false;
export async function ensureBrainTables(): Promise<void> {
  if (ensured) return;
  // `runBrainMigrations` has the Nitro plugin signature
  // `(nitroApp) => Promise<void>`, but never touches the argument — it's a
  // type-compatibility shape so the same runner can also be registered as a
  // Nitro plugin. `null` mirrors the direct-call pattern in
  // scripts/migrate-production.ts.
  await runBrainMigrations(null);
  ensured = true;
}

function ownerFilter(owner: BrainOwner) {
  // owner_email already scopes a row to exactly one human, so org_id adds no
  // security here — it's metadata only (still written on create). ANDing it
  // into reads used to let a mismatched org_id between surfaces (a row
  // written with org_id null and read with orgId set, or vice versa —
  // plausible across web vs Telegram) silently hide a member's own entries.
  return eq(brainEntries.ownerEmail, owner.email);
}

export async function createBrainEntry(
  owner: BrainOwner,
  input: {
    type: BrainEntry["type"];
    title: string;
    body: string;
    sourceThreadId?: string | null;
    status: BrainEntry["status"];
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
  filter: {
    type?: BrainEntry["type"];
    status?: BrainEntry["status"];
    query?: string;
    limit?: number;
  } = {},
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

export async function getBrainEntry(owner: BrainOwner, id: string): Promise<BrainEntry | null> {
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
  patch: Partial<Pick<BrainEntry, "type" | "title" | "body" | "status">>,
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

const DIGEST_PATH = "instructions/personal-brain.md";

export async function syncBrainDigest(owner: BrainOwner): Promise<void> {
  await ensureBrainTables();
  const db = getDb();
  const prefs = await listBrainEntries(owner, { type: "preference", status: "kept" });
  // Query the "other" bucket directly with its own type-exclusion + limit
  // instead of buffering the top-N kept entries of any type and filtering
  // afterward: buffering first means a member with many kept preferences can
  // crowd genuinely recent non-preference entries out of the buffer window
  // before the preference filter ever runs, silently under-filling this
  // section even though 20 qualifying entries exist.
  const others = await db
    .select()
    .from(brainEntries)
    .where(and(ownerFilter(owner), eq(brainEntries.status, "kept"), ne(brainEntries.type, "preference")))
    .orderBy(desc(brainEntries.updatedAt))
    .limit(20);
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
  const saved = await resourcePut(owner.email, DIGEST_PATH, content, "text/markdown");
  if (saved.content !== content) {
    throw new Error("brain digest write could not be verified");
  }
}
