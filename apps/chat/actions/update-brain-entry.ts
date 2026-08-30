/**
 * Update a private brain entry the current member owns. Also used to promote
 * a proposed memory to kept (or revert it).
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { syncBrainDigest, updateBrainEntry } from "../server/lib/brain-store";

const entryType = z.enum(["fact", "preference", "lesson", "note"]);
const entryStatus = z.enum(["proposed", "kept"]);

export default defineAction({
  description: "Update a brain entry the member owns (type, title, body, or status).",
  schema: z.object({
    id: z.string(),
    type: entryType.optional(),
    title: z.string().min(1).max(120).optional(),
    body: z.string().min(1).max(2000).optional(),
    status: entryStatus.optional(),
  }),
  run: async ({ id, ...patch }, ctx) => {
    const owner = ownerFromCtx(ctx);
    const entry = await updateBrainEntry(owner, id, patch);
    if (!entry) throw new Error("Entry not found");
    await syncBrainDigest(owner);
    return { updated: true as const, entry };
  },
});
