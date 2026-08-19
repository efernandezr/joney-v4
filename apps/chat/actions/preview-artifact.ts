/**
 * Open an HTML artifact in the user's preview panel.
 *
 * Writes the `artifact-preview` application-state key; the UI panel
 * subscribes to it and renders the artifact in a sandboxed iframe.
 */
import { defineAction } from "@agent-native/core/action";
import {
  readAppState,
  writeAppState,
} from "@agent-native/core/application-state";
import { resourceGet } from "@agent-native/core/resources/store";
import { z } from "zod";

import { ARTIFACT_FILE_RENDERER } from "../app/lib/artifact-file-renderer";

export default defineAction({
  description:
    "Reopen an EXISTING HTML artifact in the user's side preview panel. Only for artifacts that are not already open — save-artifact already opens the preview when saving, so never call this right after save-artifact.",
  schema: z.object({
    resourceId: z.string().describe("ID of the text/html resource to preview"),
  }),
  http: false,
  chatUI: { renderer: ARTIFACT_FILE_RENDERER, title: "Artifact preview" },
  run: async ({ resourceId }, ctx) => {
    const resource = await resourceGet(resourceId);
    if (!resource) {
      throw new Error(`Artifact not found: ${resourceId}`);
    }
    if (resource.mimeType !== "text/html") {
      throw new Error(
        `Only HTML artifacts can be previewed (got ${resource.mimeType}).`,
      );
    }
    // Already open (e.g. a redundant call right after save-artifact): return
    // without the `file` payload so the transcript doesn't render a second
    // identical file card.
    const current = await readAppState("artifact-preview");
    if (current?.resourceId === resource.id) {
      return {
        opened: true as const,
        alreadyOpen: true as const,
        path: resource.path,
      };
    }
    await writeAppState("artifact-preview", {
      resourceId: resource.id,
      path: resource.path,
      // Agent tool calls carry the conversation id; UI/HTTP callers don't.
      // The chat panel scopes previews to this conversation; null renders
      // on the Artifacts page instead.
      threadId: ctx?.threadId ?? null,
    });
    return {
      opened: true as const,
      path: resource.path,
      file: {
        resourceId: resource.id,
        path: resource.path,
        name: resource.path.split("/").pop() ?? resource.path,
        contentType: resource.mimeType,
        sizeBytes: resource.size,
      },
    };
  },
});
