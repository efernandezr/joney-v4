import { readAppState, writeAppState } from "@agent-native/core/application-state";
import { resourcePut, WORKSPACE_OWNER } from "@agent-native/core/resources/store";
import { runWithRequestContext } from "@agent-native/core/server";
import { beforeEach, describe, expect, it } from "vitest";

import previewArtifact from "../actions/preview-artifact";

describe("preview-artifact action", () => {
  beforeEach(async () => {
    await runWithRequestContext({ userEmail: "test@example.com" }, async () => {
      await writeAppState("artifact-preview", null);
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

      expect(result).toEqual({ opened: true, path: "artifacts/test-page.html" });
      const state = await readAppState<{ resourceId: string; path: string }>(
        "artifact-preview",
      );
      expect(state).toMatchObject({
        resourceId: resource.id,
        path: "artifacts/test-page.html",
      });
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
});
