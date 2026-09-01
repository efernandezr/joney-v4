import { describe, expect, it } from "vitest";

// Regression for the first production Brain write (2026-09-01): the v1
// migration's raw SQL created `promotable INTEGER` on Postgres, while the
// portable schema helper maps `integer(..., { mode: "boolean" })` to a
// Postgres BOOLEAN column — so every insert sent `false` into an INTEGER
// column and Postgres rejected it ("invalid input syntax for type integer").
// SQLite coerces silently, which is why every other brain test stays green
// while production is broken. This suite runs the real store against a
// Postgres engine (PGlite) to pin the dialect the deploy actually uses.
//
// DATABASE_URL must be set before brain-store is imported: the portable
// schema helpers pick their dialect per column at module-import time.
// File-backed rather than pglite:memory — the migration runner closes its
// direct exec when done, and closePgliteClient() evicts the shared cached
// client, which would destroy an in-memory database before the store's
// first query.
process.env.DATABASE_URL = "pglite:./data/vitest-pglite";

// Unique per run: the pglite data dir persists across local runs like
// vitest.db does, so a fixed email would accumulate rows.
const owner = { email: `pg-owner-${crypto.randomUUID()}@example.com`, orgId: null };

describe("brain-store on the postgres dialect", () => {
  it("createBrainEntry persists and reads back a kept entry", async () => {
    const { createBrainEntry, ensureBrainTables } = await import(
      "../server/lib/brain-store"
    );
    await ensureBrainTables();

    const entry = await createBrainEntry(owner, {
      type: "preference",
      title: "Marketing, AI, and app improvement interests",
      body: "Enjoys discussing app improvements and the future of marketing with AI.",
      status: "kept",
    });

    expect(entry.status).toBe("kept");
    expect(entry.promotable).toBe(false);
  });
});
