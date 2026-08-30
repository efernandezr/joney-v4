/**
 * List the current member's private brain entries, optionally filtered by
 * type, status, or a text query.
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { listBrainEntries } from "../server/lib/brain-store";

const entryType = z.enum(["fact", "preference", "lesson", "note"]);
const entryStatus = z.enum(["proposed", "kept"]);

export default defineAction({
  description: "List the member's private brain entries, optionally filtered by type, status, or query.",
  schema: z.object({
    type: entryType.optional(),
    status: entryStatus.optional(),
    query: z.string().max(200).optional(),
  }),
  http: { method: "GET" },
  run: async (input, ctx) => {
    const owner = ownerFromCtx(ctx);
    const entries = await listBrainEntries(owner, input);
    return { entries };
  },
});
