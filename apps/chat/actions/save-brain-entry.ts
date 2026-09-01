/**
 * Save an entry the member explicitly wants kept in their private brain.
 * Distinct from agent-inferred proposals (see propose-memory).
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { createBrainEntry, syncBrainDigest } from "../server/lib/brain-store";

const entryType = z.enum(["fact", "preference", "lesson", "note"]);

export default defineAction({
  description:
    "Save an entry the member explicitly wants in their private brain (status kept). The member's Brain / 'My Brain' is this app's built-in memory store: when the user asks to save something to their Brain, call this action — never delegate to a connected agent or app named Brain. For memories YOU infer from conversation, use propose-memory instead.",
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
