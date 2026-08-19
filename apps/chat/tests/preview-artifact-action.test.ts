import { deleteAppState, readAppState } from "@agent-native/core/application-state";
import { resourcePut, WORKSPACE_OWNER } from "@agent-native/core/resources/store";
import { runWithRequestContext } from "@agent-native/core/server";
import { beforeEach, describe, expect, it } from "vitest";

import previewArtifact from "../actions/preview-artifact";

describe("preview-artifact action", () => {
  beforeEach(async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      await deleteAppState("artifact-preview");
    });
  });

  it("writes the artifact-preview app state and returns the path", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/test-page.html",
        "<html><body>hi</body></html>",
        "text/html",
      );

      const result = await previewArtifact.run({ resourceId: resource.id });

      expect(result).toMatchObject({
        opened: true,
        path: "artifacts/test-page.html",
        file: {
          resourceId: resource.id,
          path: "artifacts/test-page.html",
          name: "test-page.html",
          contentType: "text/html",
        },
      });
      expect(typeof (result as { file: { sizeBytes: number } }).file.sizeBytes).toBe("number");
      const state = (await readAppState("artifact-preview")) as {
        resourceId: string;
        path: string;
      } | null;
      expect(state).toMatchObject({
        resourceId: resource.id,
        path: "artifacts/test-page.html",
      });
    });
  });

  it("returns no file card when the artifact is already open", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/already-open.html",
        "<html><body>a</body></html>",
        "text/html",
      );
      const first = await previewArtifact.run({ resourceId: resource.id });
      expect(first).toHaveProperty("file");

      // Redundant second call (e.g. right after save-artifact): no `file`
      // payload, so the transcript renders no duplicate card.
      const second = await previewArtifact.run({ resourceId: resource.id });
      expect(second).toMatchObject({ opened: true, alreadyOpen: true });
      expect(second).not.toHaveProperty("file");
    });
  });

  it("rejects a missing resource", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      await expect(
        previewArtifact.run({ resourceId: "does-not-exist" }),
      ).rejects.toThrow(/not found/i);
    });
  });

  it("rejects non-HTML resources", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/notes.md",
        "# notes",
        "text/markdown",
      );
      await expect(
        previewArtifact.run({ resourceId: resource.id }),
      ).rejects.toThrow(/Only HTML artifacts/i);
    });
  });

  it("stores the calling agent's threadId in the preview state", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/threaded.html",
        "<html><body>t</body></html>",
        "text/html",
      );
      await previewArtifact.run({ resourceId: resource.id }, {
        caller: "tool",
        threadId: "thread-123",
      } as never);
      const state = (await readAppState("artifact-preview")) as {
        threadId: string | null;
      };
      expect(state.threadId).toBe("thread-123");
    });
  });

  it("stores threadId null for non-agent callers", async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      const resource = await resourcePut(
        WORKSPACE_OWNER,
        "artifacts/manual.html",
        "<html><body>m</body></html>",
        "text/html",
      );
      await previewArtifact.run({ resourceId: resource.id });
      const state = (await readAppState("artifact-preview")) as {
        threadId: string | null;
      };
      expect(state.threadId).toBeNull();
    });
  });
});
