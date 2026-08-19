/**
 * Shared scope and permission rules for HTML artifacts in the resource store.
 *
 * Scope is the resource's owner column — the framework's mutually exclusive
 * sharing levels:
 *   personal      owner = the creator's email; only they can read it
 *   organization  owner = __organization__:<orgId>; readable by org members
 *   workspace     owner = __shared__; readable by every signed-in user of
 *                 this deployment (the framework's app-shared layer)
 *
 * The creator is recorded in the resource's metadata JSON as `createdBy`.
 * Only the creator manages an artifact; artifacts without a recorded creator
 * (legacy rows: demo seeds, pre-tracking saves) are manageable by anyone,
 * and the first person to change their scope adopts them as creator.
 */
import {
  organizationResourceOwner,
  SHARED_OWNER,
  WORKSPACE_OWNER,
} from "@agent-native/core/resources/store";

export const ARTIFACT_SCOPES = [
  "personal",
  "organization",
  "workspace",
] as const;
export type ArtifactScope = (typeof ARTIFACT_SCOPES)[number];

export function isHtmlArtifact(resource: {
  path: string;
  mimeType: string;
}): boolean {
  return (
    resource.path.startsWith("artifacts/") && resource.mimeType === "text/html"
  );
}

export function artifactOwnerForScope(
  scope: ArtifactScope,
  ctx: { userEmail?: string; orgId?: string | null },
): string {
  if (scope === "personal") {
    if (!ctx.userEmail) throw new Error("Authentication required");
    return ctx.userEmail;
  }
  if (scope === "organization") {
    if (!ctx.orgId) throw new Error("No active organization");
    return organizationResourceOwner(ctx.orgId);
  }
  return SHARED_OWNER;
}

export function artifactCreatedBy(
  metadata: string | Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;
  try {
    const parsed =
      typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    const createdBy = (parsed as { createdBy?: unknown })?.createdBy;
    return typeof createdBy === "string" && createdBy ? createdBy : null;
  } catch {
    return null;
  }
}

export function canManageArtifact(
  resource: {
    owner: string;
    metadata: string | Record<string, unknown> | null;
  },
  userEmail: string | undefined,
): boolean {
  const createdBy = artifactCreatedBy(resource.metadata);
  if (createdBy) return createdBy === userEmail;
  // Personal artifacts are always the owner's, even without metadata.
  if (
    resource.owner !== SHARED_OWNER &&
    resource.owner !== WORKSPACE_OWNER &&
    !resource.owner.startsWith("__organization__")
  ) {
    return resource.owner === userEmail;
  }
  // Legacy shared rows with no recorded creator: open to any signed-in user.
  return !!userEmail;
}
