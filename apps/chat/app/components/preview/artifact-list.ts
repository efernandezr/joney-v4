// app/components/preview/artifact-list.ts
//
// Shared selection logic for HTML artifacts shown in the artifacts list
// (app/routes/artifacts.tsx) and the preview panel's switcher
// (ArtifactPreviewPanel.tsx). The live resource store legitimately holds the
// same `path` under multiple owner scopes (e.g. an agent-authored artifact
// and a workspace copy), so this dedupes by path, keeping whichever row was
// updated most recently, and sorts newest-first.

export interface ArtifactResource {
  id: string;
  path: string;
  mimeType?: string | null;
  updatedAt?: number | null;
}

/**
 * Filter resources down to HTML artifacts, dedupe by `path` (keeping the
 * most recently updated entry for each path), and sort newest-first.
 */
export function selectHtmlArtifacts<T extends ArtifactResource>(
  resources: T[] | undefined | null,
): T[] {
  const htmlArtifacts = (resources ?? []).filter(
    (r) => r.path?.startsWith("artifacts/") && r.mimeType === "text/html",
  );

  const newestByPath = new Map<string, T>();
  for (const resource of htmlArtifacts) {
    const existing = newestByPath.get(resource.path);
    if (!existing || (resource.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      newestByPath.set(resource.path, resource);
    }
  }

  return [...newestByPath.values()].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  );
}
