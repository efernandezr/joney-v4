/**
 * Permanently delete an HTML artifact. Only its creator may delete it;
 * legacy artifacts with no recorded creator are open to any signed-in user.
 */
import { defineAction } from "@agent-native/core/action";
import {
  deleteAppState,
  readAppState,
} from "@agent-native/core/application-state";
import {
  resourceDelete,
  resourceGet,
} from "@agent-native/core/resources/store";
import { z } from "zod";

import {
  canManageArtifact,
  isHtmlArtifact,
} from "../server/lib/artifact-access";

export default defineAction({
  description:
    "Permanently delete an HTML artifact. Only the artifact's creator may delete it. Ask the user to confirm before calling this.",
  schema: z.object({
    resourceId: z.string().describe("ID of the artifact resource to delete"),
  }),
  run: async ({ resourceId }, ctx) => {
    if (!ctx?.userEmail) throw new Error("Authentication required");
    const resource = await resourceGet(resourceId);
    if (!resource) throw new Error(`Artifact not found: ${resourceId}`);
    if (!isHtmlArtifact(resource)) {
      throw new Error("Only HTML artifacts under artifacts/ can be deleted.");
    }
    if (!canManageArtifact(resource, ctx.userEmail)) {
      throw new Error("Only the artifact's creator can delete it.");
    }

    await resourceDelete(resource.id);

    const preview = await readAppState("artifact-preview");
    if (preview?.resourceId === resource.id) {
      await deleteAppState("artifact-preview");
    }

    return { ok: true as const, path: resource.path };
  },
});
