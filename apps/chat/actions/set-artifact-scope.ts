/**
 * Move an HTML artifact between sharing scopes (personal / organization /
 * workspace). Scope is the resource's owner column, so this is a move:
 * write the row under the new owner, delete the old one, and repoint any
 * open preview at the new resource id.
 */
import { defineAction } from "@agent-native/core/action";
import {
  readAppState,
  writeAppState,
} from "@agent-native/core/application-state";
import {
  resourceDelete,
  resourceGet,
  resourcePut,
} from "@agent-native/core/resources/store";
import { z } from "zod";

import {
  ARTIFACT_SCOPES,
  artifactCreatedBy,
  artifactOwnerForScope,
  canManageArtifact,
  isHtmlArtifact,
} from "../server/lib/artifact-access";

export default defineAction({
  description:
    "Change who can see an HTML artifact: personal (only its creator), organization (members of the active organization), or workspace (every signed-in user of this app). Only the artifact's creator may change its scope.",
  schema: z.object({
    resourceId: z.string().describe("ID of the artifact resource"),
    scope: z.enum(ARTIFACT_SCOPES).describe("Target sharing scope"),
  }),
  run: async ({ resourceId, scope }, ctx) => {
    if (!ctx?.userEmail) throw new Error("Authentication required");
    const resource = await resourceGet(resourceId);
    if (!resource) throw new Error(`Artifact not found: ${resourceId}`);
    if (!isHtmlArtifact(resource)) {
      throw new Error("Only HTML artifacts under artifacts/ can be scoped.");
    }
    if (!canManageArtifact(resource, ctx.userEmail)) {
      throw new Error("Only the artifact's creator can change its scope.");
    }

    const targetOwner = artifactOwnerForScope(scope, ctx);
    if (targetOwner === resource.owner) {
      return { ok: true as const, scope, resourceId: resource.id };
    }

    // The first person to manage a legacy artifact adopts it as creator.
    const createdBy = artifactCreatedBy(resource.metadata) ?? ctx.userEmail;
    const moved = await resourcePut(
      targetOwner,
      resource.path,
      resource.content,
      resource.mimeType,
      { metadata: { createdBy } },
    );
    await resourceDelete(resource.id);

    const preview = await readAppState("artifact-preview");
    if (preview?.resourceId === resource.id) {
      await writeAppState("artifact-preview", {
        ...preview,
        resourceId: moved.id,
        path: moved.path,
      });
    }

    return { ok: true as const, scope, resourceId: moved.id };
  },
});
