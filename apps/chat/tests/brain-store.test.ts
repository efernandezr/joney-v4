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
