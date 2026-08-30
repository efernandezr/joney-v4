/**
 * Check whether the current member has completed the personal-agent birth
 * ritual yet, and get the agent's name for greeting/UI purposes.
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { readPersona } from "../server/lib/persona-store";

export default defineAction({
  description: "Check whether this member has created their personal agent, and get its name.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async (_input, ctx) => {
    const owner = ownerFromCtx(ctx);
    const profile = await readPersona(owner.email);
    if (!profile) return { exists: false as const };
    return { exists: true as const, name: profile.name, createdAt: profile.createdAt };
  },
});
