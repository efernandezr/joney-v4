/**
 * Search the member's private brain for memories beyond the always-loaded
 * digest (which only carries a bounded slice of kept entries).
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { listBrainEntries } from "../server/lib/brain-store";

export default defineAction({
  description: "Search the member's private brain for memories beyond the always-loaded digest.",
  schema: z.object({
    query: z.string().min(2).max(200),
  }),
  http: { method: "GET" },
  run: async ({ query }, ctx) => {
    const owner = ownerFromCtx(ctx);
    const entries = await listBrainEntries(owner, { query });
    return { entries };
  },
});
