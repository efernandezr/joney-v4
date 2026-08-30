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
