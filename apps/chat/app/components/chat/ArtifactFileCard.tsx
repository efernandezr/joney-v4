import {
  registerActionChatRenderer,
  registerToolRenderer,
  type ToolRendererProps,
} from "@agent-native/core/client/agent-chat";
import {
  resourceDownloadUrl,
  useResource,
} from "@agent-native/core/client/resources";
import {
  IconDownload,
  IconFileText,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

import { ArtifactExpandDialog } from "@/components/preview/ArtifactExpandDialog";
import { useArtifactPreview } from "@/components/preview/use-artifact-preview";
import { beginPendingArtifact } from "@/lib/artifact-pending";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ARTIFACT_FILE_RENDERER } from "@/lib/artifact-file-renderer";

interface ArtifactFilePayload {
  resourceId: string;
  path: string;
  name: string;
  contentType: string;
  sizeBytes: number;
}

function parseFilePayload(resultJson: unknown): ArtifactFilePayload | null {
  if (!resultJson || typeof resultJson !== "object") return null;
  const file = (resultJson as { file?: unknown }).file;
  if (!file || typeof file !== "object") return null;
  const f = file as Partial<ArtifactFilePayload>;
  if (
    typeof f.resourceId !== "string" ||
    !f.resourceId ||
    typeof f.path !== "string" ||
    typeof f.name !== "string" ||
    typeof f.contentType !== "string" ||
    typeof f.sizeBytes !== "number" ||
    !Number.isFinite(f.sizeBytes)
  ) {
    return null;
  }
  return {
    resourceId: f.resourceId,
    path: f.path,
    name: f.name,
    contentType: f.contentType,
    sizeBytes: f.sizeBytes,
  };
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Transcript card for save-artifact / preview-artifact results: file info
 * plus inline CTAs. "Open preview" writes the artifact-preview app state
 * directly, so the drawer slides open without any navigation or reload.
 */
export function ArtifactFileCard({ context }: ToolRendererProps) {
  const { open, activeThreadId } = useArtifactPreview();
  const location = useLocation();
  const file = parseFilePayload(context.resultJson);
  // The chat-scoped preview drawer only exists on the full chat page. When
  // this card renders in the agent sidebar on any other page, "Open preview"
  // opens the resizable popup instead — same fallback rule as the Artifacts
  // page in narrow mode.
  const onChatRoute =
    location.pathname === "/" || location.pathname.startsWith("/chat/");
  const [expandOpen, setExpandOpen] = useState(false);
  const expandResource = useResource(
    expandOpen && file ? file.resourceId : null,
  );
  const queryClient = useQueryClient();
  const isPending = context.isRunning && !file;
  // Serverless sync can take up to a minute to notice the agent's write, but
  // this card streams into the transcript the moment the tool completes —
  // so IT is the fast signal. While the save runs, publish a pending flag
  // (the gallery shows a skeleton card); on live completion, refetch the
  // artifact list immediately. Live vs replay: either this mounted card saw
  // the running phase, or it completed as the active tail of a running turn.
  // A replayed old thread is neither, so it triggers no refetch.
  const sawRunningRef = useRef(isPending);
  const invalidatedRef = useRef(false);
  useEffect(() => {
    if (!isPending) return;
    sawRunningRef.current = true;
    return beginPendingArtifact();
  }, [isPending]);
  const fileResourceId = file?.resourceId ?? null;
  const isLiveCompletion =
    !!fileResourceId && (sawRunningRef.current || context.isActiveTail === true);
  useEffect(() => {
    if (isLiveCompletion && !invalidatedRef.current) {
      invalidatedRef.current = true;
      sawRunningRef.current = false;
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  }, [isLiveCompletion, queryClient]);

  if (!file) {
    if (!context.isRunning) return null;
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <IconFileText className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{file.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {formatFileSize(file.sizeBytes)} · {file.path}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={resourceDownloadUrl(file.resourceId)}
          download={file.name}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium no-underline hover:bg-accent hover:no-underline"
        >
          <IconDownload className="size-3.5" aria-hidden="true" />
          Download
        </a>
        <Button
          type="button"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            if (onChatRoute) {
              void open({
                resourceId: file.resourceId,
                path: file.path,
                threadId: activeThreadId,
              });
            } else {
              setExpandOpen(true);
            }
          }}
        >
          <IconLayoutSidebarRightExpand className="size-3.5" aria-hidden="true" />
          Open preview
        </Button>
      </div>
      {!onChatRoute && (
        <ArtifactExpandDialog
          open={expandOpen}
          onOpenChange={setExpandOpen}
          path={file.path}
          content={expandResource.data?.content ?? null}
        />
      )}
    </div>
  );
}

// Module-scope registration; re-registration under HMR is benign because the
// registry resolves to the first (identical) match.
registerActionChatRenderer({
  id: "chat.artifact-file-card",
  renderer: ARTIFACT_FILE_RENDERER,
  Component: ArtifactFileCard,
});
// The chatUI renderer config only attaches once the tool RESULT arrives, so
// the registration above never renders during the running phase. Matching
// the tool names directly makes the card render while the save streams —
// that's what powers the in-transcript skeleton and the gallery's pending
// card. (After the result, the chatUI registration resolves first — same
// component either way.)
for (const toolName of ["save-artifact", "preview-artifact"]) {
  registerToolRenderer({
    id: `chat.artifact-file-card:${toolName}`,
    match: toolName,
    Component: ArtifactFileCard,
  });
}
