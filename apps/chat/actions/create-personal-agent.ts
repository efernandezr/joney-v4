/**
 * Create the member's personal agent at the end of the birth ritual: writes
 * the persona resource and stages any role facts the agent learned as
 * `proposed` brain entries for the member to confirm.
 */
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ownerFromCtx } from "../server/lib/brain-owner";
import { createBrainEntry } from "../server/lib/brain-store";
import { writePersona } from "../server/lib/persona-store";

export default defineAction({
  description:
    "Create the member's personal agent at the end of the birth ritual. Call once, with the member's chosen name and the persona summary they agreed to. Role facts you learned go in roleFacts — they become proposals the member confirms.",
  schema: z.object({
    name: z.string().min(1).max(40),
    persona: z.string().min(10).max(2000),
    roleFacts: z
      .array(z.object({ title: z.string().max(120), body: z.string().max(500) }))
      .max(10)
      .optional(),
  }),
  run: async (input, ctx) => {
    const owner = ownerFromCtx(ctx);
    await writePersona(owner.email, { name: input.name, persona: input.persona });
    for (const fact of input.roleFacts ?? []) {
      await createBrainEntry(owner, {
        type: "fact",
        title: fact.title,
        body: fact.body,
        status: "proposed",
      });
    }
    return { created: true as const, name: input.name };
  },
});
