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
// Unique per run: vitest.db is a persistent SQLite file (not reset between
// runs), and this test asserts an exact count. A fixed email would
// accumulate rows across repeated local runs and make the assertion flaky.
const carol = { email: `carol-${crypto.randomUUID()}@example.com`, orgId: "org-1" };

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

  it("syncBrainDigest includes up to 20 non-preference entries even with many kept preferences", async () => {
    // Regression test for a buffer-then-filter bug: querying only the top 60
    // most-recently-updated kept entries of ANY type, then filtering out
    // preferences afterward, let a large number of *more recently updated*
    // kept preferences crowd older (but still wanted) non-preference entries
    // out of that buffer before the type filter ever ran. Lessons are
    // created first (older), then 45 preferences are created after them
    // (newer) so the preferences dominate the top-60 recency window: the
    // buggy implementation surfaced only 15 non-preference lines
    // (60 - 45 preferences = 15 lesson slots left in the buffer) instead of
    // the full 20-entry cap the digest format specifies.
    for (let i = 0; i < 25; i++) {
      await createBrainEntry(carol, {
        type: "lesson",
        title: `Lesson ${i}`,
        body: "lesson body",
        status: "kept",
      });
    }
    for (let i = 0; i < 45; i++) {
      await createBrainEntry(carol, {
        type: "preference",
        title: `Pref ${i}`,
        body: "pref body",
        status: "kept",
      });
    }

    await syncBrainDigest(carol);

    await runWithRequestContext({ userEmail: carol.email }, async () => {
      const digest = await resourceGetByPath(carol.email, "instructions/personal-brain.md");
      expect(digest).not.toBeNull();
      const content = String(digest?.content ?? "");
      const otherLines = content.split("\n").filter((line) => line.startsWith("- [lesson]"));
      expect(otherLines.length).toBe(20);
    });
  });
});
