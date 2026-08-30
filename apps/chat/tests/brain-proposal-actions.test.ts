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
