/**
 * Save an HTML deliverable as a shared artifact and open it in the preview
 * panel. One deterministic call for the agent: no scope guessing, no
 * separate preview step.
 */
import { defineAction } from "@agent-native/core/action";
import { ACTION_CHAT_UI_WORKSPACE_FILE_RENDERER } from "@agent-native/core/action-ui";
import { writeAppState } from "@agent-native/core/application-state";
import { resourcePut, SHARED_OWNER } from "@agent-native/core/resources/store";
import { z } from "zod";

export default defineAction({
  description:
    "Save an HTML deliverable (page, dashboard, document, game) as a workspace artifact and open it in the user's preview panel. Use this for EVERY HTML deliverable instead of the resources tool. Path must be under artifacts/ and end with .html.",
  schema: z.object({
    path: z
      .string()
      .regex(/^artifacts\/[\w.-]+\.html$/, "Path must match artifacts/<name>.html")
      .describe("Artifact path, e.g. artifacts/kpi-dashboard.html"),
    content: z.string().min(1).describe("Complete HTML document content"),
  }),
  http: false,
  chatUI: { renderer: ACTION_CHAT_UI_WORKSPACE_FILE_RENDERER, title: "Artifact saved" },
  run: async ({ path, content }, ctx) => {
    const resource = await resourcePut(SHARED_OWNER, path, content, "text/html");
    await writeAppState("artifact-preview", {
      resourceId: resource.id,
      path: resource.path,
      threadId: ctx?.threadId ?? null,
    });
    return {
      saved: true as const,
      path: resource.path,
      file: {
        resourceId: resource.id,
        path: resource.path,
        name: resource.path.split("/").pop() ?? resource.path,
        contentType: "text/html",
        sizeBytes: resource.size,
      },
    };
  },
});
