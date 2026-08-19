import {
  deleteAppState,
  readAppState,
  writeAppState,
} from "@agent-native/core/application-state";
import {
  resourceDeleteByPath,
  resourceGet,
  resourceGetByPath,
  resourcePut,
  SHARED_OWNER,
} from "@agent-native/core/resources/store";
import { runWithRequestContext } from "@agent-native/core/server";
import { beforeEach, describe, expect, it } from "vitest";

import deleteArtifact from "../actions/delete-artifact";
import getArtifactPins from "../actions/get-artifact-pins";
import setArtifactPin from "../actions/set-artifact-pin";
import setArtifactScope from "../actions/set-artifact-scope";

const CREATOR = "creator@example.com";
const OTHER = "other@example.com";
const ORG_ID = "org-test-1";

function asCreator<T>(fn: () => Promise<T>) {
  return runWithRequestContext({ userEmail: CREATOR }, fn);
}

async function seedArtifact(
  path: string,
  createdBy: string | null = CREATOR,
): Promise<string> {
  const resource = await resourcePut(
    SHARED_OWNER,
    path,
    "<html><body>x</body></html>",
    "text/html",
    { metadata: createdBy ? { createdBy } : null },
  );
  return resource.id;
}

describe("artifact admin actions", () => {
  beforeEach(async () => {
    await asCreator(async () => {
      await deleteAppState("artifact-preview");
      for (const owner of [SHARED_OWNER, CREATOR, OTHER]) {
        await resourceDeleteByPath(owner, "artifacts/admin-test.html");
      }
    });
  });

  it("moves an artifact to personal scope and repoints the open preview", async () => {
    await asCreator(async () => {
      const id = await seedArtifact("artifacts/admin-test.html");
      await writeAppState("artifact-preview", {
        resourceId: id,
        path: "artifacts/admin-test.html",
        threadId: null,
      });

      const result = await setArtifactScope.run(
        { resourceId: id, scope: "personal" },
        { userEmail: CREATOR } as never,
      );
      expect(result.ok).toBe(true);

      expect(await resourceGet(id)).toBeNull();
      const moved = await resourceGetByPath(
        CREATOR,
        "artifacts/admin-test.html",
      );
      expect(moved).not.toBeNull();
      expect(moved?.owner).toBe(CREATOR);

      const preview = await readAppState("artifact-preview");
      expect(preview?.resourceId).toBe(moved?.id);
    });
  });

  it("refuses scope changes and deletes from non-creators", async () => {
    await asCreator(async () => {
      const id = await seedArtifact("artifacts/admin-test.html");
      await expect(
        setArtifactScope.run(
          { resourceId: id, scope: "personal" },
          { userEmail: OTHER } as never,
        ),
      ).rejects.toThrow(/creator/i);
      await expect(
        deleteArtifact.run(
          { resourceId: id },
          { userEmail: OTHER } as never,
        ),
      ).rejects.toThrow(/creator/i);
    });
  });

  it("lets anyone manage a legacy artifact with no recorded creator", async () => {
    await asCreator(async () => {
      const id = await seedArtifact("artifacts/admin-test.html", null);
      const result = await setArtifactScope.run(
        { resourceId: id, scope: "organization" },
        { userEmail: OTHER, orgId: ORG_ID } as never,
      );
      expect(result.ok).toBe(true);
      const moved = await resourceGet(result.resourceId);
      expect(moved?.owner).toContain(ORG_ID);
      // The mover adopted the artifact.
      expect(JSON.parse(moved?.metadata ?? "{}").createdBy).toBe(OTHER);
    });
  });

  it("deletes an artifact and clears a preview pointing at it", async () => {
    await asCreator(async () => {
      const id = await seedArtifact("artifacts/admin-test.html");
      await writeAppState("artifact-preview", {
        resourceId: id,
        path: "artifacts/admin-test.html",
        threadId: null,
      });

      const result = await deleteArtifact.run(
        { resourceId: id },
        { userEmail: CREATOR } as never,
      );
      expect(result.ok).toBe(true);
      expect(await resourceGet(id)).toBeNull();
      expect(await readAppState("artifact-preview")).toBeNull();
    });
  });

  it("round-trips per-user pins keyed by path", async () => {
    await asCreator(async () => {
      const first = await setArtifactPin.run(
        { path: "artifacts/pin-me.html", pinned: true },
        { userEmail: CREATOR } as never,
      );
      expect(first.paths).toContain("artifacts/pin-me.html");

      const listed = await getArtifactPins.run(
        {},
        { userEmail: CREATOR } as never,
      );
      expect(listed.paths).toContain("artifacts/pin-me.html");

      // Pins are per-user.
      const otherList = await getArtifactPins.run(
        {},
        { userEmail: OTHER } as never,
      );
      expect(otherList.paths).not.toContain("artifacts/pin-me.html");

      const removed = await setArtifactPin.run(
        { path: "artifacts/pin-me.html", pinned: false },
        { userEmail: CREATOR } as never,
      );
      expect(removed.paths).not.toContain("artifacts/pin-me.html");
    });
  });
});
