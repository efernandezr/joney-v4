import { deleteAppState, readAppState } from "@agent-native/core/application-state";
import { resourceGet } from "@agent-native/core/resources/store";
import { runWithRequestContext } from "@agent-native/core/server";
import { beforeEach, describe, expect, it } from "vitest";

import saveArtifact from "../actions/save-artifact";

describe("save-artifact action", () => {
  beforeEach(async () => {
    await runWithRequestContext({ userEmail: "save-artifact-test@example.com" }, async () => {
      await deleteAppState("artifact-preview");
    });
  });

  it("saves the artifact and opens the preview", async () => {
    await runWithRequestContext({ userEmail: "save-artifact-test@example.com" }, async () => {
      const result = await saveArtifact.run(
        { path: "artifacts/save-test.html", content: "<html><body>s</body></html>" },
        { threadId: "t-9" } as never,
      );

      expect(result).toMatchObject({
        saved: true,
        path: "artifacts/save-test.html",
        file: {
          path: "artifacts/save-test.html",
          name: "save-test.html",
          contentType: "text/html",
        },
      });

      const file = (result as { file: { resourceId: string; sizeBytes: number } }).file;
      expect(typeof file.sizeBytes).toBe("number");

      const resource = await resourceGet(file.resourceId);
      expect(resource).toMatchObject({
        path: "artifacts/save-test.html",
        mimeType: "text/html",
      });

      const state = (await readAppState("artifact-preview")) as {
        resourceId: string;
        path: string;
        threadId: string | null;
      } | null;
      expect(state).toMatchObject({
        resourceId: file.resourceId,
        path: "artifacts/save-test.html",
        threadId: "t-9",
      });
    });
  });

  it("rejects a path outside artifacts/", async () => {
    await runWithRequestContext({ userEmail: "save-artifact-test@example.com" }, async () => {
      await expect(
        saveArtifact.run({ path: "notes/evil.html", content: "<p>x</p>" }),
      ).rejects.toThrow();
    });
  });

  it("rejects a non-.html path", async () => {
    await runWithRequestContext({ userEmail: "save-artifact-test@example.com" }, async () => {
      await expect(
        saveArtifact.run({ path: "artifacts/x.js", content: "x" }),
      ).rejects.toThrow();
    });
  });

  it("overwrites content when saved twice at the same path", async () => {
    await runWithRequestContext({ userEmail: "save-artifact-test@example.com" }, async () => {
      await saveArtifact.run({
        path: "artifacts/overwrite-test.html",
        content: "<html><body>first</body></html>",
      });

      const second = await saveArtifact.run({
        path: "artifacts/overwrite-test.html",
        content: "<html><body>second</body></html>",
      });

      const file = (second as { file: { resourceId: string } }).file;
      const resource = await resourceGet(file.resourceId);
      expect(resource?.content).toBe("<html><body>second</body></html>");
    });
  });
});
