/**
 * Delete a private brain entry the current member owns.
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { deleteBrainEntry, syncBrainDigest } from "../server/lib/brain-store";

export default defineAction({
  description: "Delete a brain entry the member owns.",
  schema: z.object({
    id: z.string(),
  }),
  run: async ({ id }, ctx) => {
    const owner = ownerFromCtx(ctx);
    const ok = await deleteBrainEntry(owner, id);
    if (!ok) throw new Error("Entry not found");
    await syncBrainDigest(owner);
    return { deleted: true as const };
  },
});
