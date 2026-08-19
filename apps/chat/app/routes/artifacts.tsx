import { agentNativePath } from "@agent-native/core/client/api-path";
import {
  useActionMutation,
  useActionQuery,
  useChangeVersion,
  useSession,
} from "@agent-native/core/client/hooks";
import {
  useResource,
  useResources,
  type ResourceMeta,
} from "@agent-native/core/client/resources";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconPinned,
  IconPinnedOff,
  IconTrash,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { ArtifactExpandDialog } from "@/components/preview/ArtifactExpandDialog";
import { ArtifactPreviewPanel } from "@/components/preview/ArtifactPreviewPanel";
import { selectHtmlArtifacts } from "@/components/preview/artifact-list";
import { useArtifactPreview } from "@/components/preview/use-artifact-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingArtifacts } from "@/lib/artifact-pending";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "Artifacts" }];
}

export function HydrateFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-b-2 border-foreground" />
    </div>
  );
}

const PAGE_SIZE = 12;
const GRID_CLASS =
  "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4";

/**
 * Below this route width the inline split preview is suppressed and card
 * clicks open the resizable popup instead — the split needs room for both
 * a usable grid and a usable preview, which a narrow window or an open
 * agent chat rail doesn't leave.
 */
const SPLIT_MIN_WIDTH = 1100;

type ArtifactScope = "personal" | "organization" | "workspace";

const SCOPE_LABELS: Record<ArtifactScope, string> = {
  personal: "Personal (only you)",
  organization: "Organization",
  workspace: "Workspace (everyone)",
};

function scopeOfOwner(owner: string): ArtifactScope {
  if (owner === "__shared__" || owner === "__workspace__") return "workspace";
  if (owner.startsWith("__organization__")) return "organization";
  return "personal";
}

function createdByOf(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const createdBy = (JSON.parse(metadata) as { createdBy?: unknown })
      ?.createdBy;
    return typeof createdBy === "string" && createdBy ? createdBy : null;
  } catch {
    return null;
  }
}

const RELATIVE_STEPS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60_000, "minute"],
  [3_600_000, "hour"],
  [86_400_000, "day"],
  [604_800_000, "week"],
  [2_592_000_000, "month"],
  [31_536_000_000, "year"],
];

function formatRelative(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  for (let i = RELATIVE_STEPS.length - 1; i >= 0; i--) {
    const [unitMs, unit] = RELATIVE_STEPS[i];
    if (abs >= unitMs) return rtf.format(Math.round(diff / unitMs), unit);
  }
  return "just now";
}

function artifactRawUrl(id: string): string {
  return agentNativePath(
    `/_agent-native/resources/${encodeURIComponent(id)}?raw`,
  );
}

function ArtifactCard({
  resource,
  pinned,
  canManage,
  onOpen,
  onTogglePin,
  onSetScope,
  onDelete,
}: {
  resource: ResourceMeta;
  pinned: boolean;
  canManage: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onSetScope: (scope: ArtifactScope) => void;
  onDelete: () => void;
}) {
  const name = resource.path.replace(/^artifacts\//, "");
  const scope = scopeOfOwner(resource.owner);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-[border-color,box-shadow] hover:border-ring/40 hover:shadow-md">
      <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-white">
        <iframe
          // Thumbnail render only: fully locked sandbox — no scripts, no
          // same-origin — since ?raw serves the artifact from the app origin.
          sandbox=""
          loading="lazy"
          src={artifactRawUrl(resource.id)}
          title={`Thumbnail of ${name}`}
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 bg-white"
        />
      </div>
      <div className="flex items-start gap-1 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <button
            type="button"
            onClick={onOpen}
            // Stretched hit area: the pseudo-element makes the whole card
            // clickable while keeping a real button for focus/keyboard.
            className="truncate text-left text-sm font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {name}
          </button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {pinned && <IconPinned className="size-3" aria-label="Pinned" />}
            {scope === "personal" && "Personal · "}
            Edited {formatRelative(resource.updatedAt ?? 0)}
          </span>
        </div>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Artifact options: ${name}`}
              className={cn(
                "relative z-10 size-7 shrink-0 text-muted-foreground",
                !menuOpen &&
                  "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100",
              )}
            >
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={onTogglePin}>
              {pinned ? (
                <>
                  <IconPinnedOff className="size-4" /> Unpin
                </>
              ) : (
                <>
                  <IconPinned className="size-4" /> Pin
                </>
              )}
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Who can see it</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={scope}
                  onValueChange={(value) =>
                    onSetScope(value as ArtifactScope)
                  }
                >
                  {(
                    Object.entries(SCOPE_LABELS) as Array<
                      [ArtifactScope, string]
                    >
                  ).map(([value, label]) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash className="size-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ArtifactsRoute() {
  const artifacts = useResources("all");
  const { open, preview, collapsed } = useArtifactPreview();
  const { session } = useSession();
  const userEmail = session?.email ?? null;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ResourceMeta | null>(null);
  const consumedPreviewParam = useRef(false);

  // Width-based preview mode: wide → inline split panel; narrow (agent chat
  // rail open, small window) → resizable popup. jsdom has no ResizeObserver;
  // tests stay in wide mode.
  const rootRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [dialogArtifact, setDialogArtifact] = useState<{
    id: string;
    path: string;
  } | null>(null);
  const dialogResource = useResource(dialogArtifact?.id ?? null);

  // Artifact saves currently streaming in the agent sidebar: show a
  // generating skeleton card so the user sees it's on its way.
  const pendingArtifacts = usePendingArtifacts();

  // Live refresh: refetch the artifact list when the agent writes a resource.
  // The "resources" change counter covers same-process SSE; the preview
  // app-state change (every save-artifact updates it) covers serverless
  // cross-invocation writes via the poll fallback.
  const resourcesVersion = useChangeVersion("resources");
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["resources"] });
  }, [resourcesVersion, preview?.resourceId, queryClient]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setNarrow(width > 0 && width < SPLIT_MIN_WIDTH);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const pinsQuery = useActionQuery("get-artifact-pins", {});
  const pinnedPaths = useMemo(
    () =>
      new Set<string>((pinsQuery.data as { paths?: string[] })?.paths ?? []),
    [pinsQuery.data],
  );

  const setPin = useActionMutation("set-artifact-pin", {
    onSuccess: () => void pinsQuery.refetch(),
    onError: () => toast.error("Couldn't update the pin"),
  });
  const setScope = useActionMutation("set-artifact-scope", {
    onSuccess: (result: { scope?: string }) => {
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success(
        `Visibility set to ${SCOPE_LABELS[(result?.scope as ArtifactScope) ?? "workspace"]}`,
      );
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Couldn't change visibility",
      ),
  });
  const deleteArtifact = useActionMutation("delete-artifact", {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Artifact deleted");
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Couldn't delete the artifact",
      ),
  });

  const htmlArtifacts = useMemo(() => {
    const selected = selectHtmlArtifacts(artifacts.data ?? []);
    // Pinned first; stable sort keeps newest-first within each group.
    return [...selected].sort(
      (a, b) =>
        Number(pinnedPaths.has(b.path)) - Number(pinnedPaths.has(a.path)),
    );
  }, [artifacts.data, pinnedPaths]);

  const pageCount = Math.max(1, Math.ceil(htmlArtifacts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedArtifacts = htmlArtifacts.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const previewOpen =
    !!preview?.resourceId &&
    "threadId" in preview &&
    preview.threadId === null &&
    !collapsed;

  async function previewArtifact(resourceId: string, path: string) {
    if (narrow) {
      setDialogArtifact({ id: resourceId, path });
      return;
    }
    try {
      await open({ resourceId, path, threadId: null });
    } catch {
      toast.error("Couldn't open the preview");
    }
  }

  useEffect(() => {
    if (consumedPreviewParam.current) return;
    // Wait for a settled, fresh fetch: `isLoading` alone is false when
    // react-query serves a stale cached list while a background refetch is
    // in flight, which would false-negative on a link to a just-created
    // artifact.
    if (artifacts.isLoading || artifacts.isFetching) return;
    const previewId = searchParams.get("preview");
    if (!previewId) return;

    consumedPreviewParam.current = true;
    const match = htmlArtifacts.find((r) => r.id === previewId);
    if (match) {
      void previewArtifact(match.id, match.path);
    } else if (artifacts.isError) {
      toast.error("Couldn't load artifacts");
    } else {
      toast.error("Artifact not found");
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("preview");
        return next;
      },
      { replace: true },
    );
  }, [
    artifacts.isLoading,
    artifacts.isFetching,
    artifacts.isError,
    htmlArtifacts,
    searchParams,
    setSearchParams,
  ]);

  return (
    <div ref={rootRef} className="flex h-full min-h-0">
      <div
        className={cn(
          "min-w-0 flex-1 overflow-y-auto",
          // On narrow screens the open preview takes the full width.
          previewOpen && "hidden md:block",
        )}
      >
        <div className="mx-auto w-full max-w-6xl p-6">
          <h1 className="mb-5 text-xl font-semibold">Artifacts</h1>
          {artifacts.isLoading ? (
            <div className={GRID_CLASS}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-1.5 p-3">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : htmlArtifacts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16">
              <p className="text-sm text-muted-foreground">
                No artifacts yet.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/">Ask the agent to create one</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className={GRID_CLASS}>
                {currentPage === 0 &&
                  Array.from({ length: pendingArtifacts }).map((_, i) => (
                    <div
                      key={`pending-${i}`}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <Skeleton className="aspect-[4/3] w-full rounded-none" />
                      <div className="space-y-1.5 p-3">
                        <Skeleton className="h-4 w-3/5" />
                        <span className="block text-xs text-muted-foreground">
                          Generating…
                        </span>
                      </div>
                    </div>
                  ))}
                {pagedArtifacts.map((r) => {
                  const createdBy = createdByOf(r.metadata);
                  const canManage =
                    !!userEmail &&
                    (createdBy
                      ? createdBy === userEmail
                      : scopeOfOwner(r.owner) !== "personal" ||
                        r.owner === userEmail);
                  return (
                    <ArtifactCard
                      key={r.id}
                      resource={r}
                      pinned={pinnedPaths.has(r.path)}
                      canManage={canManage}
                      onOpen={() => void previewArtifact(r.id, r.path)}
                      onTogglePin={() =>
                        setPin.mutate({
                          path: r.path,
                          pinned: !pinnedPaths.has(r.path),
                        })
                      }
                      onSetScope={(scope) =>
                        setScope.mutate({ resourceId: r.id, scope })
                      }
                      onDelete={() => setDeleteTarget(r)}
                    />
                  );
                })}
              </div>
              {pageCount > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Previous page"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {currentPage + 1} / {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Next page"
                    disabled={currentPage >= pageCount - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {!narrow && <ArtifactPreviewPanel scope="page" />}
      <ArtifactExpandDialog
        open={dialogArtifact !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialogArtifact(null);
        }}
        path={dialogArtifact?.path ?? ""}
        content={dialogResource.data?.content ?? null}
      />
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.path.replace(/^artifacts\//, "")}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the artifact for everyone. It can't be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteArtifact.mutate({ resourceId: deleteTarget.id });
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
