import {
  resourceDownloadUrl,
  useResource,
  useResources,
} from "@agent-native/core/client/resources";
import {
  IconArrowsDiagonal,
  IconDownload,
  IconLink,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { ArtifactExpandDialog } from "./ArtifactExpandDialog";
import { selectHtmlArtifacts } from "./artifact-list";
import {
  useArtifactPreview,
  useChatPreviewLinkParam,
} from "./use-artifact-preview";

const MAX_INLINE_BYTES = 1024 * 1024;

export function ArtifactPreviewPanel({
  scope,
}: {
  scope: "chat" | "page";
}) {
  const { preview, activeThreadId, open, collapsed, collapse, expand } =
    useArtifactPreview();
  const resource = useResource(preview?.resourceId ?? null);
  const artifacts = useResources("all");
  // Collapse plays the drawer's exit animation first; the panel only
  // unmounts once it finishes (animationend, or the timeout fallback).
  const [closing, setClosing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useChatPreviewLinkParam(scope === "chat", activeThreadId, open);

  // A new artifact arriving mid-close cancels the exit so it stays open.
  useEffect(() => {
    setClosing(false);
  }, [preview?.resourceId]);

  // Fallback in case animationend never fires (animation interrupted,
  // background tab, test environment without CSS animations).
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => {
      setClosing(false);
      collapse();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [closing]);

  function beginCollapse() {
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      collapse();
      return;
    }
    setClosing(true);
  }

  if (!preview?.resourceId || !preview?.path) return null;
  if (!("threadId" in preview)) return null; // pre-scoping legacy value
  if (
    scope === "chat" &&
    (activeThreadId === null || preview.threadId !== activeThreadId)
  )
    return null;
  if (scope === "page" && preview.threadId !== null) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={expand}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-border bg-card px-2 py-3 text-xs font-medium shadow-md animate-in fade-in-0 slide-in-from-right duration-200 ease-[var(--ease-collapse)] hover:bg-accent motion-reduce:animate-none"
        aria-label={`Reopen preview: ${preview.path.replace(/^artifacts\//, "")}`}
      >
        <span className="[writing-mode:vertical-rl]">
          {preview.path.replace(/^artifacts\//, "")}
        </span>
      </button>
    );
  }

  const htmlArtifacts = selectHtmlArtifacts(artifacts.data);

  return (
    <aside
      className={cn(
        "my-3 mr-3 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        // Drawer entrance on mount (first open and expand-from-collapsed both
        // remount this aside); exit plays while `closing` before unmount.
        closing
          ? "animate-out fade-out-0 slide-out-to-right fill-mode-forwards"
          : "animate-in fade-in-0 slide-in-from-right",
        "duration-300 ease-[var(--ease-drawer)] motion-reduce:animate-none",
        scope === "chat" ? "w-[45%] min-w-[360px] shrink-0" : "min-w-0 flex-1",
      )}
      onAnimationEnd={(event) => {
        if (!closing || event.target !== event.currentTarget) return;
        setClosing(false);
        collapse();
      }}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <div className="min-w-0 flex-1">
          {htmlArtifacts.length > 1 ? (
            <select
              aria-label="Artifact"
              className="min-w-0 w-full truncate rounded-md border border-border bg-background px-2 py-1 text-sm"
              value={preview.resourceId}
              onChange={(event) => {
                const next = htmlArtifacts.find(
                  (r) => r.id === event.target.value,
                );
                if (next)
                  void open({
                    resourceId: next.id,
                    path: next.path,
                    threadId: preview.threadId,
                  });
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
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            const url = `${window.location.origin}/artifacts?preview=${encodeURIComponent(preview.resourceId)}`;
            try {
              void navigator.clipboard.writeText(url).then(
                () => toast.success("Link copied"),
                () => toast.error("Couldn't copy the link"),
              );
            } catch {
              toast.error("Couldn't copy the link");
            }
          }}
        >
          <IconLink className="size-3.5" /> Copy link
        </Button>
        <a
          href={resourceDownloadUrl(preview.resourceId)}
          download
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <IconDownload className="size-3.5" /> Export
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Expand preview"
          disabled={!resource.data || resource.data.size > MAX_INLINE_BYTES}
          onClick={() => setExpanded(true)}
        >
          <IconArrowsDiagonal className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Collapse preview"
          onClick={beginCollapse}
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
              This artifact is too large to preview inline. Use Export above
              to download it.
            </p>
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
      <ArtifactExpandDialog
        open={expanded}
        onOpenChange={setExpanded}
        path={preview.path}
        content={resource.data?.content ?? null}
      />
    </aside>
  );
}
