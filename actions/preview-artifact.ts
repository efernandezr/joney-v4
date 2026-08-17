/**
 * Open an HTML artifact in the user's preview panel.
 *
 * Writes the `artifact-preview` application-state key; the UI panel
 * subscribes to it and renders the artifact in a sandboxed iframe.
 */
import { defineAction } from "@agent-native/core/action";
import { writeAppState } from "@agent-native/core/application-state";
import { resourceGet } from "@agent-native/core/resources/store";
import { z } from "zod";

export default defineAction({
  description:
    "Open an HTML artifact (a workspace resource such as artifacts/page.html) in the user's side preview panel so they can see and interact with it. Call this right after creating or updating an HTML artifact.",
  schema: z.object({
    resourceId: z.string().describe("ID of the text/html resource to preview"),
  }),
  http: false,
  run: async ({ resourceId }) => {
    const resource = await resourceGet(resourceId);
    if (!resource) {
      throw new Error(`Artifact not found: ${resourceId}`);
    }
    if (resource.mimeType !== "text/html") {
      throw new Error(
        `Only HTML artifacts can be previewed (got ${resource.mimeType}).`,
      );
    }
    await writeAppState("artifact-preview", {
      resourceId: resource.id,
      path: resource.path,
    });
    return { opened: true as const, path: resource.path };
  },
});
