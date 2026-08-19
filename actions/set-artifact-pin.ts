/**
 * Pin or unpin an artifact for the current user. Pins are a per-user
 * preference stored in user settings; pinned artifacts sort first in the
 * Artifacts gallery. Pins key on the artifact path, which survives scope
 * moves (a scope change re-creates the resource under a new id).
 */
import { defineAction } from "@agent-native/core/action";
import { getUserSetting, putUserSetting } from "@agent-native/core/settings";
import { z } from "zod";

import { PINS_SETTING_KEY } from "./get-artifact-pins";

export default defineAction({
  description:
    "Pin or unpin an artifact in the current user's Artifacts gallery. Pinned artifacts sort first for that user only.",
  schema: z.object({
    path: z
      .string()
      .describe("Artifact path, e.g. artifacts/kpi-dashboard.html"),
    pinned: z.boolean().describe("true to pin, false to unpin"),
  }),
  run: async ({ path, pinned }, ctx) => {
    if (!ctx?.userEmail) throw new Error("Authentication required");
    const setting = await getUserSetting(ctx.userEmail, PINS_SETTING_KEY);
    const current = Array.isArray(setting?.paths)
      ? (setting.paths as unknown[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];
    const paths = pinned
      ? [...new Set([path, ...current])]
      : current.filter((p) => p !== path);
    await putUserSetting(ctx.userEmail, PINS_SETTING_KEY, { paths });
    return { ok: true as const, pinned, paths };
  },
});
