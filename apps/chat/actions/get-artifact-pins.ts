/**
 * The current user's pinned artifacts (a per-user preference; pinned
 * artifacts sort first in the Artifacts gallery).
 */
import { defineAction } from "@agent-native/core/action";
import { getUserSetting } from "@agent-native/core/settings";
import { z } from "zod";

export const PINS_SETTING_KEY = "artifact-pins";

export default defineAction({
  description:
    "List the paths of the artifacts the current user has pinned in the Artifacts gallery.",
  schema: z.object({}),
  // Read-only: useActionQuery fetches with GET.
  http: { method: "GET" },
  run: async (_args, ctx) => {
    if (!ctx?.userEmail) return { paths: [] as string[] };
    const setting = await getUserSetting(ctx.userEmail, PINS_SETTING_KEY);
    const paths = Array.isArray(setting?.paths)
      ? (setting.paths as unknown[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];
    return { paths };
  },
});
