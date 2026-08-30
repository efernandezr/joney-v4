/**
 * Propose a memory the agent inferred from conversation. Unlike
 * save-brain-entry, this never lands as kept directly — the member reviews
 * it (see review-brain-entry) before it enters the digest.
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { BRAIN_PROPOSAL_RENDERER } from "../app/lib/brain-proposal-renderer";
import { ownerFromCtx } from "../server/lib/brain-owner";
import { createBrainEntry } from "../server/lib/brain-store";

const entryType = z.enum(["fact", "preference", "lesson", "note"]);

export default defineAction({
  description:
    "Propose a durable memory for the member's private brain after a meaningful moment in conversation. The member must approve it — never present a proposal as saved. Propose sparingly: one clearly valuable memory beats five trivial ones.",
  schema: z.object({
    type: entryType,
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(2000),
  }),
  http: false,
  chatUI: { renderer: BRAIN_PROPOSAL_RENDERER, title: "Memory proposed" },
  run: async (input, ctx) => {
    const owner = ownerFromCtx(ctx);
    const entry = await createBrainEntry(owner, {
      ...input,
      status: "proposed",
      sourceThreadId: ctx?.threadId ?? null,
    });
    return { proposed: true as const, entry };
  },
});
