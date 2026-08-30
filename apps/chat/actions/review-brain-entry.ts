/**
 * Review a proposed memory: keep it (promotes to kept and re-syncs the
 * digest) or dismiss it (deletes it outright). This is the only path a
 * proposal takes into the digest — propose-memory never syncs it directly.
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { deleteBrainEntry, syncBrainDigest, updateBrainEntry } from "../server/lib/brain-store";

export default defineAction({
  description: "Review a proposed brain entry: keep it (promote to kept) or dismiss it (delete).",
  schema: z.object({
    id: z.string(),
    decision: z.enum(["keep", "dismiss"]),
  }),
  http: false,
  run: async ({ id, decision }, ctx) => {
    const owner = ownerFromCtx(ctx);
    if (decision === "keep") {
      const entry = await updateBrainEntry(owner, id, { status: "kept" });
      if (!entry) throw new Error("Entry not found");
      await syncBrainDigest(owner);
      return { reviewed: true as const, decision, entry };
    }
    const ok = await deleteBrainEntry(owner, id);
    if (!ok) throw new Error("Entry not found");
    return { reviewed: true as const, decision };
  },
});
