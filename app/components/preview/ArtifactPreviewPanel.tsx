import {
  resourceDownloadUrl,
  useResource,
  useResources,
} from "@agent-native/core/client/resources";
import { IconDownload, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

import { useArtifactPreview } from "./use-artifact-preview";

const MAX_INLINE_BYTES = 1024 * 1024;

export function ArtifactPreviewPanel() {
  const { preview, open, close } = useArtifactPreview();
  const resource = useResource(preview?.resourceId ?? null);
  const artifacts = useResources("all");

  if (!preview) return null;

  const htmlArtifacts = (artifacts.data ?? []).filter(
    (r) => r.path?.startsWith("artifacts/") && r.mimeType === "text/html",
  );

  return (
    <aside className="flex w-[45%] min-w-[320px] shrink-0 flex-col border-l border-border bg-card">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        {htmlArtifacts.length > 1 ? (
          <select
            aria-label="Artifact"
            className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={preview.resourceId}
            onChange={(event) => {
              const next = htmlArtifacts.find(
                (r) => r.id === event.target.value,
              );
              if (next) void open({ resourceId: next.id, path: next.path });
            }}
          >
            {htmlArtifacts.map((r) => (
              <option key={r.id} value={r.id}>
                {r.path.replace(/^artifacts\//, "")}
              </option>
            ))}
          </select>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {preview.path.replace(/^artifacts\//, "")}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close preview"
          onClick={() => void close()}
        >
          <IconX className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1">
        {resource.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-b-2 border-foreground" />
          </div>
        ) : resource.isError || !resource.data ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn't load this artifact.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void resource.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : resource.data.size > MAX_INLINE_BYTES ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This artifact is too large to preview inline.
            </p>
            <a
              href={resourceDownloadUrl(resource.data.id)}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <IconDownload className="size-3.5" /> Download
            </a>
          </div>
        ) : (
          <iframe
            // Security invariant: sandbox stays exactly "allow-scripts".
            // No allow-same-origin — generated HTML must not reach app
            // cookies, storage, or APIs. Locked by the component test.
            sandbox="allow-scripts"
            srcDoc={resource.data.content}
            title={preview.path}
            className="h-full w-full border-0 bg-white"
          />
        )}
      </div>
    </aside>
  );
}
