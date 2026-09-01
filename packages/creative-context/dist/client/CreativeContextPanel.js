import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFormatters, useT } from "@agent-native/core/client/i18n";
import { useOrg } from "@agent-native/core/client/org";
import { useUploadResource } from "@agent-native/core/client/uploads";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Badge, Button, Checkbox, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, } from "@agent-native/toolkit/ui";
import { IconAlertTriangle, IconArrowUpRight, IconBooks, IconChartBar, IconCheck, IconDots, IconFileImport, IconFileText, IconLayout, IconPalette, IconPhoto, IconPlayerPlay, IconPin, IconPlus, IconRefresh, IconSearch, IconSlideshow, IconSparkles, IconUpload, IconWorld, } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, } from "react";
import { creativeContextMediaUrl } from "../media-url.js";
import { useCreativeContextBrandProfile, useCreativeContexts, useCanonicalLogoCandidates, useCreativeContextConnections, useCreativeContextGooglePickerSession, useCreativeContextRootRecommendations, useCreativeContextImportStatus, useCreativeContextPack, useCreativeContextPacks, useContextMemberships, useManageCreativeContext, useManageContextMembership, useCreativeContextSearch, useCreativeContextSuggestions, useCreativeContextSources, useManageCreativeContextSource, useManageLayoutTemplate, usePreviewCreativeContextImport, usePublishCreativeContextBrandDna, useConfirmCanonicalLogo, useProposeCanonicalLogo, useRefreshCreativeContextSource, useReviewCreativeContextItems, useStartCreativeContextImport, parseCreativeContexts, parseContextMemberships, } from "./actions.js";
import { useCreativeContextState, } from "./application-state.js";
import { CreativeContextChip } from "./CreativeContextChip.js";
import { chooseGoogleSlidesPresentations } from "./google-slides-picker.js";
const CONNECTORS = [
    {
        kind: "google-slides",
        label: "Google Slides",
        referencePlaceholder: "Presentation URLs or IDs — one per line",
        referenceRequired: false,
        icon: IconSlideshow,
    },
    {
        kind: "figma",
        label: "Figma",
        referencePlaceholder: "Team, project, or file URLs — one per line",
        referenceRequired: false,
        icon: IconPalette,
    },
    {
        kind: "notion",
        label: "Notion",
        referencePlaceholder: "Page or teamspace root URLs / IDs — one per line",
        referenceRequired: false,
        icon: IconFileText,
    },
    {
        kind: "website",
        label: "Website",
        referencePlaceholder: "https://example.com\nhttps://example.com/about",
        referenceRequired: true,
        icon: IconWorld,
    },
    {
        kind: "upload",
        label: "Uploaded files",
        referencePlaceholder: "One hosted file URL per line",
        referenceRequired: true,
        icon: IconUpload,
    },
];
function isVisibleInScope(visibility, scope) {
    return scope === "org" ? visibility !== "private" : visibility === "private";
}
function splitReferences(value) {
    return value
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean);
}
function connectionProviderForConnector(kind) {
    if (kind === "google-slides")
        return "google_drive";
    if (kind === "figma" || kind === "notion")
        return kind;
    return null;
}
function recommendationProviderForConnector(kind) {
    if (kind === "google-slides" || kind === "figma" || kind === "notion") {
        return kind;
    }
    return null;
}
export function parseFigmaRecommendationBoundary(reference) {
    for (const value of splitReferences(reference)) {
        const teamId = value.match(/\/team\/([^/?#]+)/)?.[1] ??
            (value.startsWith("team:") ? value.slice("team:".length) : undefined);
        if (teamId)
            return { figmaTeamId: teamId };
        const projectId = value.match(/\/project\/([^/?#]+)/)?.[1] ??
            (value.startsWith("project:")
                ? value.slice("project:".length)
                : undefined);
        if (projectId)
            return { figmaProjectId: projectId };
    }
    return {};
}
export function selectRenderableLayoutThumbnails(thumbnails) {
    return thumbnails.filter((thumbnail) => thumbnail.hasThumbnail).slice(0, 3);
}
export function mergeRecommendationSelection(current, available, previouslySeen) {
    const next = new Set([...current].filter((externalId) => available.has(externalId)));
    for (const externalId of available) {
        if (!previouslySeen.has(externalId))
            next.add(externalId);
    }
    return next;
}
export function buildCreativeContextSourceConfig(kind, reference, uploadedFiles, recommendations = []) {
    const references = splitReferences(reference);
    if (kind === "google-slides") {
        const presentationIds = references.flatMap((value) => {
            const match = value.match(/\/presentation\/d\/([^/?#]+)/);
            const id = match?.[1] ?? (/^https?:\/\//.test(value) ? "" : value);
            return id ? [id] : [];
        });
        return {
            presentationIds: [
                ...new Set([
                    ...presentationIds,
                    ...recommendations.map((item) => item.externalId),
                ]),
            ],
        };
    }
    if (kind === "figma") {
        const fileUrls = [];
        const projectUrls = [];
        const teamUrls = [];
        for (const url of references) {
            if (/\/team\//.test(url))
                teamUrls.push(url);
            else if (/\/project\//.test(url))
                projectUrls.push(url);
            else
                fileUrls.push(url);
        }
        return {
            fileUrls,
            projectUrls,
            teamUrls,
            ...(recommendations.length
                ? { fileKeys: recommendations.map((item) => item.externalId) }
                : {}),
        };
    }
    if (kind === "notion") {
        const rootPageIds = [];
        const rootPageUrls = [];
        const teamspaceRootPageIds = [];
        const teamspaceRootPageUrls = [];
        for (const root of references) {
            const isTeamspace = root.startsWith("teamspace:");
            const value = isTeamspace ? root.slice("teamspace:".length) : root;
            if (/^https?:\/\//.test(value)) {
                (isTeamspace ? teamspaceRootPageUrls : rootPageUrls).push(value);
            }
            else {
                (isTeamspace ? teamspaceRootPageIds : rootPageIds).push(value);
            }
        }
        return {
            rootPageIds: [
                ...rootPageIds,
                ...recommendations.map((item) => item.externalId),
            ],
            rootPageUrls,
            teamspaceRootPageIds,
            teamspaceRootPageUrls,
        };
    }
    if (kind === "website")
        return { urls: references };
    return { items: uploadedFiles };
}
function ContextModeButton({ mode, activeMode, label, description, disabled, onSelect, }) {
    const selected = mode === activeMode;
    return (_jsxs("button", { type: "button", role: "radio", "aria-checked": selected, disabled: disabled, onClick: () => onSelect(mode), className: `min-w-0 flex-1 cursor-pointer rounded-md border px-3 py-2 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${selected
            ? "border-foreground/25 bg-accent/70 text-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`, children: [_jsx("span", { className: "block text-sm font-medium", children: label }), _jsx("span", { className: "mt-0.5 block text-xs leading-relaxed", children: description })] }));
}
function ScopeControl({ scope, onChange, }) {
    const t = useT();
    return (_jsx("div", { className: "inline-flex rounded-md border border-border bg-muted/30 p-0.5", children: ["user", "org"].map((value) => (_jsx("button", { type: "button", "aria-pressed": scope === value, onClick: () => onChange(value), className: `rounded px-2.5 py-1 text-xs font-medium transition-colors ${scope === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"}`, children: t(value === "user"
                ? "creativeContext.personal"
                : "creativeContext.organization") }, value))) }));
}
function SourceRow({ source, refreshing, canReview, onRefresh, onReview, onCurate, canPromote, onPromote, onPause, onRestore, onDelete, }) {
    const t = useT();
    const formatters = useFormatters();
    const formatDate = formatters.formatDate.bind(formatters);
    const formatNumber = formatters.formatNumber.bind(formatters);
    return (_jsxs("div", { className: "flex items-start gap-3 border-t border-border/60 py-3 first:border-t-0", children: [_jsx("div", { className: "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground", children: _jsx(IconBooks, { className: "size-4" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "truncate text-sm font-medium text-foreground", children: source.name }), _jsx(Badge, { variant: "secondary", className: "font-normal", children: source.kind }), source.status === "error" ? (_jsx(Badge, { variant: "destructive", className: "font-normal", children: t("creativeContext.sourceError") })) : source.status !== "active" ? (_jsx(Badge, { variant: "outline", className: "font-normal", children: source.status })) : null] }), _jsxs("div", { className: "mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground", children: [_jsx("span", { children: t("creativeContext.itemsLabel", {
                                    count: formatNumber(source.itemCount),
                                }) }), source.lastSyncedAt ? (_jsx("span", { children: formatDate(source.lastSyncedAt, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                }) })) : null] }), source.restrictedItemCount > 0 ? (_jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-700 dark:text-amber-300", children: [_jsx("span", { children: t("creativeContext.restrictedItems", {
                                    count: formatNumber(source.restrictedItemCount),
                                }) }), canReview ? (_jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: () => onReview(source), children: t("creativeContext.reviewRestricted") })) : null] })) : null, source.lastError ? (_jsx("p", { className: "mt-1 line-clamp-2 text-xs text-destructive", children: source.lastError })) : null] }), source.status !== "archived" ? (_jsxs(Button, { type: "button", variant: "ghost", size: "sm", disabled: refreshing, onClick: () => onRefresh(source.id), children: [_jsx(IconRefresh, { className: refreshing ? "animate-spin" : undefined }), refreshing
                        ? t("creativeContext.refreshing")
                        : t("creativeContext.refresh")] })) : null, _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { type: "button", variant: "ghost", size: "icon", "aria-label": t("creativeContext.manage"), children: _jsx(IconDots, {}) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onSelect: () => onCurate(source), children: t("creativeContext.curateItems") }), source.status === "paused" || source.status === "error" ? (_jsx(DropdownMenuItem, { onSelect: () => onRestore(source), children: t("creativeContext.restore") })) : (_jsx(DropdownMenuItem, { onSelect: () => onPause(source), children: t("creativeContext.pause") })), canPromote ? (_jsx(DropdownMenuItem, { onSelect: () => onPromote(source), children: t("creativeContext.promoteToOrganization") })) : null, _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { className: "text-destructive focus:text-destructive", onSelect: () => onDelete(source), children: t("creativeContext.delete") })] })] })] }));
}
function PackRow({ pack, pinned, disabled, onPin, onDetails, }) {
    const t = useT();
    const formatters = useFormatters();
    const formatNumber = formatters.formatNumber.bind(formatters);
    return (_jsxs("div", { className: "flex items-center gap-3 border-t border-border/60 py-3 first:border-t-0", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "truncate text-sm font-medium", children: pack.name }), pinned ? (_jsxs(Badge, { variant: "secondary", className: "font-normal", children: [_jsx(IconPin, { className: "me-1 size-3" }), t("creativeContext.pinned")] })) : null] }), pack.description ? (_jsx("p", { className: "mt-0.5 line-clamp-2 text-xs text-muted-foreground", children: pack.description })) : null, _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("creativeContext.itemsLabel", {
                            count: formatNumber(pack.memberCount),
                        }) })] }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onDetails(pack.id), children: t("creativeContext.packDetails") }), _jsxs(Button, { type: "button", variant: pinned ? "secondary" : "ghost", size: "sm", disabled: disabled, onClick: () => onPin(pinned ? null : pack.id), children: [_jsx(IconPin, {}), pinned ? t("creativeContext.unpin") : t("creativeContext.pin")] })] }));
}
function AccessScopedThumbnail({ itemId, itemVersionId, className, }) {
    const [failed, setFailed] = useState(false);
    if (failed) {
        return (_jsx("div", { className: `flex items-center justify-center bg-muted text-muted-foreground ${className}`, children: _jsx(IconFileText, { className: "size-5" }) }));
    }
    return (_jsx("img", { src: creativeContextMediaUrl({ itemId, itemVersionId }), alt: "", className: className, onError: () => setFailed(true) }));
}
function ItemCuration({ source, items, busy, onReview, onClose, }) {
    const t = useT();
    return (_jsxs("div", { className: "mt-4 rounded-md border border-border p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: t("creativeContext.curateItems") }), _jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: source.name })] }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: onClose, children: t("creativeContext.cancel") })] }), _jsx("div", { className: "mt-3 grid gap-3 sm:grid-cols-2", children: items.map((item) => (_jsxs("article", { className: "overflow-hidden rounded-md border border-border/70", children: [item.thumbnailBlobRef ? (_jsx(AccessScopedThumbnail, { itemId: item.id, itemVersionId: item.currentVersionId, className: "aspect-video w-full object-cover" }, item.currentVersionId)) : (_jsx("div", { className: "flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground", children: _jsx(IconFileText, { className: "size-5" }) })), _jsxs("div", { className: "p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-medium", children: item.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: item.kind })] }), _jsxs("div", { className: "flex flex-wrap justify-end gap-1", children: [item.curationRank === "exemplar" ? (_jsx(Badge, { variant: "secondary", children: t("creativeContext.exemplar") })) : null, item.status === "deprecated" ? (_jsx(Badge, { variant: "outline", children: t("creativeContext.deprecated") })) : null, item.upstreamAccess === "unknown" ? (_jsx(Badge, { variant: "outline", children: t("creativeContext.unknownAccess") })) : null] })] }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-1.5", children: [_jsx(Button, { type: "button", variant: item.starred ? "secondary" : "outline", size: "sm", disabled: busy, onClick: () => onReview(item.starred ? "unstar" : "star", item.id), children: t(item.starred
                                                ? "creativeContext.unstar"
                                                : "creativeContext.star") }), _jsx(Button, { type: "button", variant: item.curationRank === "exemplar" ? "secondary" : "outline", size: "sm", disabled: busy, onClick: () => onReview(item.curationRank === "exemplar" ? "normal" : "exemplar", item.id), children: t("creativeContext.exemplar") }), _jsx(Button, { type: "button", variant: item.curationRank === "ignored" ? "secondary" : "outline", size: "sm", disabled: busy, onClick: () => onReview(item.curationRank === "ignored" ? "normal" : "ignore", item.id), children: t("creativeContext.ignore") }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", disabled: busy, onClick: () => onReview(item.status === "deprecated" ? "restore" : "deprecate", item.id), children: t(item.status === "deprecated"
                                                ? "creativeContext.restore"
                                                : "creativeContext.deprecate") })] }), item.curationStatus === "review" ? (_jsxs("div", { className: "mt-2 flex gap-1.5 border-t border-border/60 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", size: "sm", disabled: busy, onClick: () => onReview("exclude", item.id), children: t("creativeContext.exclude") }), _jsx(Button, { type: "button", size: "sm", disabled: busy, onClick: () => onReview("approve", item.id), children: t("creativeContext.approve") })] })) : null] })] }, item.id))) })] }));
}
function StructuredPreview({ preview, compact = false, }) {
    if (!preview) {
        return (_jsx("div", { className: "flex h-full min-h-28 items-center justify-center bg-muted text-muted-foreground", children: _jsx(IconFileText, { className: "size-5" }) }));
    }
    if (preview.type === "slides") {
        const visibleSlides = compact ? preview.slides.slice(0, 3) : preview.slides;
        return (_jsxs("div", { className: "grid h-full grid-cols-3 gap-1.5 bg-muted/50 p-2", children: [visibleSlides.map((slide) => (_jsxs("div", { className: "min-w-0 rounded border border-border/70 bg-background p-1.5", children: [_jsx("span", { className: "text-[10px] font-medium text-muted-foreground", children: slide.index }), _jsx("p", { className: "mt-1 line-clamp-2 text-[11px] font-medium leading-tight", children: slide.title }), !compact && slide.excerpt ? (_jsx("p", { className: "mt-1 line-clamp-5 text-[10px] leading-snug text-muted-foreground", children: slide.excerpt })) : null] }, slide.index))), !visibleSlides.length ? (_jsxs("div", { className: "col-span-3 flex items-center justify-center text-xs text-muted-foreground", children: [preview.slideCount, " slides"] })) : null] }));
    }
    if (preview.type === "slide") {
        return (_jsxs("div", { className: "flex h-full flex-col justify-between bg-muted/50 p-4", children: [_jsxs("span", { className: "text-xs text-muted-foreground", children: ["Slide ", preview.index] }), _jsx("p", { className: "line-clamp-3 text-sm font-semibold", children: preview.title }), preview.excerpt ? (_jsx("p", { className: "line-clamp-5 text-xs leading-relaxed text-muted-foreground", children: preview.excerpt })) : null] }));
    }
    if (preview.type === "design" || preview.type === "design-frame") {
        const frames = preview.type === "design"
            ? preview.frames
            : [
                {
                    title: preview.title,
                    fileType: preview.fileType,
                    excerpt: preview.excerpt,
                },
            ];
        const visibleFrames = compact ? frames.slice(0, 4) : frames;
        return (_jsx("div", { className: "grid h-full grid-cols-2 gap-1.5 bg-muted/50 p-2", children: visibleFrames.map((frame, index) => (_jsxs("div", { className: "min-w-0 rounded border border-border/70 bg-background p-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [_jsx(IconLayout, { className: "size-3 shrink-0" }), _jsx("span", { className: "truncate text-[10px] uppercase tracking-wide", children: frame.fileType })] }), _jsx("p", { className: "mt-2 line-clamp-2 text-xs font-medium leading-tight", children: frame.title }), !compact && frame.excerpt ? (_jsx("p", { className: "mt-1 line-clamp-4 text-[10px] leading-snug text-muted-foreground", children: frame.excerpt })) : null] }, `${frame.title}-${index}`))) }));
    }
    if (preview.type === "document") {
        const visibleBlocks = preview.blocks.slice(0, compact ? 7 : 40);
        return (_jsx("article", { className: "h-full overflow-auto bg-background p-4", children: visibleBlocks.length ? (_jsx("div", { className: "space-y-2", children: visibleBlocks.map((block, index) => {
                    if (block.kind === "heading") {
                        return (_jsx("p", { className: (block.level ?? 2) <= 2
                                ? "text-sm font-semibold"
                                : "text-xs font-medium", children: block.text }, `${block.kind}-${index}`));
                    }
                    if (block.kind === "bullet") {
                        return (_jsx("p", { className: "flex gap-2 text-xs leading-relaxed text-muted-foreground before:content-['\u2022']", children: block.text }, `${block.kind}-${index}`));
                    }
                    if (block.kind === "quote") {
                        return (_jsx("blockquote", { className: "border-s-2 border-border ps-3 text-xs italic leading-relaxed text-muted-foreground", children: block.text }, `${block.kind}-${index}`));
                    }
                    if (block.kind === "code") {
                        return (_jsx("pre", { className: "overflow-hidden rounded bg-muted p-2 font-mono text-[10px] leading-relaxed", children: block.text }, `${block.kind}-${index}`));
                    }
                    return (_jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: block.text }, `${block.kind}-${index}`));
                }) })) : preview.excerpt ? (_jsx("p", { className: "mt-3 line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground", children: preview.excerpt })) : null }));
    }
    if (preview.type === "asset") {
        return (_jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground", children: [preview.mediaType === "video" ? (_jsx(IconPlayerPlay, { className: "size-6" })) : (_jsx(IconPhoto, { className: "size-6" })), !compact && preview.width && preview.height ? (_jsxs("span", { className: "text-xs", children: [preview.width, " \u00D7 ", preview.height] })) : null] }));
    }
    return (_jsxs("div", { className: "grid h-full grid-cols-2 gap-2 bg-muted/50 p-3", children: [preview.panels.slice(0, compact ? 4 : 24).map((panel) => (_jsxs("div", { className: "rounded border border-border/70 bg-background p-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [_jsx(IconChartBar, { className: "size-3" }), _jsx("span", { className: "truncate text-[10px] capitalize", children: panel.visualization })] }), _jsx("p", { className: "mt-2 line-clamp-2 text-xs font-medium", children: panel.title })] }, panel.id))), !preview.panels.length ? (_jsx("div", { className: "col-span-2 flex items-center justify-center text-xs text-muted-foreground", children: "Synthetic dashboard preview" })) : null] }));
}
function ContextPreviewVisual({ manifest, compact = false, }) {
    if (manifest.media?.mimeType?.startsWith("video/")) {
        return (_jsx("video", { controls: !compact, muted: compact, playsInline: true, preload: "metadata", src: manifest.media.url, poster: manifest.posterUrl, className: "h-full w-full bg-black object-contain" }));
    }
    if (manifest.media) {
        return (_jsx("img", { src: manifest.media.url, alt: "", className: "h-full w-full object-contain" }));
    }
    return _jsx(StructuredPreview, { preview: manifest.preview, compact: compact });
}
function ContextPreviewSheet({ manifest, onOpenChange, }) {
    const [selectedMediaUrl, setSelectedMediaUrl] = useState(null);
    useEffect(() => setSelectedMediaUrl(null), [manifest?.itemVersionId]);
    const selectedMedia = manifest?.gallery?.find((medium) => medium.url === selectedMediaUrl) ??
        manifest?.media ??
        null;
    return (_jsx(Sheet, { open: Boolean(manifest), onOpenChange: onOpenChange, children: _jsxs(SheetContent, { side: "right", className: "w-full overflow-y-auto sm:max-w-xl", children: [_jsxs(SheetHeader, { children: [_jsx(SheetTitle, { children: manifest?.title ?? "Context preview" }), _jsx(SheetDescription, { children: manifest?.kind ?? "" })] }), manifest && (selectedMedia || manifest.preview) ? (_jsx("div", { className: "mt-5 min-h-56 overflow-hidden rounded-md border border-border", children: _jsx(ContextPreviewVisual, { manifest: { ...manifest, media: selectedMedia } }) })) : (_jsx("div", { className: "mt-5 flex min-h-44 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground", children: "No safe preview is available for this item." })), manifest?.gallery && manifest.gallery.length > 1 ? (_jsx("div", { className: "mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4", children: manifest.gallery.map((medium, index) => (_jsx("button", { type: "button", className: `aspect-video overflow-hidden rounded border bg-muted transition-colors ${medium.url === (selectedMedia?.url ?? manifest.media?.url)
                            ? "border-foreground"
                            : "border-border hover:border-foreground/50"}`, onClick: () => setSelectedMediaUrl(medium.url), children: _jsx("img", { src: medium.url, alt: `Preview ${index + 1}`, loading: "lazy", className: "h-full w-full object-contain" }) }, `${medium.url}-${index}`))) })) : null] }) }));
}
function ContextRail({ contexts, selectedContextId, disabled, canCreate, onSelect, onCreate, }) {
    return (_jsxs("aside", { className: "border-b border-border/70 pb-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold", children: "Contexts" }), _jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: "Choose the reusable context that should guide this work." })] }), _jsx(Badge, { variant: "outline", children: contexts.length })] }), _jsxs("div", { className: "mt-3 flex gap-2 overflow-x-auto pb-1", children: [contexts.map((context) => (_jsxs("button", { type: "button", disabled: disabled, "aria-pressed": selectedContextId === context.id, onClick: () => onSelect(context.id), className: `min-w-40 rounded-md border px-3 py-2 text-start transition-colors disabled:opacity-60 ${selectedContextId === context.id ? "border-foreground/25 bg-accent text-foreground" : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`, children: [_jsx("span", { className: "block truncate text-sm font-medium", children: context.name }), _jsx("span", { className: "mt-0.5 block truncate text-xs", children: context.description || `${context.memberCount} resources` })] }, context.id))), _jsxs(Button, { type: "button", variant: "outline", className: "min-w-40 justify-start", disabled: disabled || !canCreate, onClick: onCreate, children: [_jsx(IconPlus, {}), " New context"] }), !contexts.length ? (_jsx("p", { className: "py-2 text-sm text-muted-foreground", children: "Create a context from a resource\u2019s Share tab to start organizing the Library." })) : null] })] }));
}
export function CreativeContextPanel({ scope = "user", canManageOrg = false, scopeControl, connectionsHref = "/settings/integrations", }) {
    const t = useT();
    const formatters = useFormatters();
    const formatNumber = formatters.formatNumber.bind(formatters);
    const { data: org } = useOrg();
    const [libraryScope, setLibraryScope] = useState(scope);
    const sourcesQuery = useCreativeContextSources({ limit: 100 });
    const contextsQuery = useCreativeContexts();
    const packsQuery = useCreativeContextPacks();
    const brandProfileQuery = useCreativeContextBrandProfile();
    const suggestionsQuery = useCreativeContextSuggestions();
    const logoCandidatesQuery = useCanonicalLogoCandidates(brandProfileQuery.data?.profile?.id, suggestionsQuery.data?.capabilities.canonicalLogo === true);
    const refreshSource = useRefreshCreativeContextSource();
    const manageSource = useManageCreativeContextSource();
    const uploadResource = useUploadResource();
    const startImport = useStartCreativeContextImport();
    const searchContext = useCreativeContextSearch();
    const reviewItems = useReviewCreativeContextItems();
    const publishBrandDna = usePublishCreativeContextBrandDna();
    const proposeCanonicalLogo = useProposeCanonicalLogo();
    const confirmCanonicalLogo = useConfirmCanonicalLogo();
    const manageLayoutTemplate = useManageLayoutTemplate();
    const contextState = useCreativeContextState();
    const [query, setQuery] = useState("");
    const [libraryView, setLibraryView] = useState("items");
    const [previewManifest, setPreviewManifest] = useState(null);
    const [savingState, setSavingState] = useState(false);
    const [stateError, setStateError] = useState(null);
    const [refreshMessage, setRefreshMessage] = useState(null);
    const [searchError, setSearchError] = useState(null);
    const [connectorKind, setConnectorKind] = useState(null);
    const connectionProvider = connectionProviderForConnector(connectorKind);
    const connectionsQuery = useCreativeContextConnections(connectionProvider);
    const [selectedConnectionId, setSelectedConnectionId] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [sourceReference, setSourceReference] = useState("");
    const recommendationProvider = recommendationProviderForConnector(connectorKind);
    const recommendationsQuery = useCreativeContextRootRecommendations(recommendationProvider, selectedConnectionId || null, connectorKind === "figma"
        ? parseFigmaRecommendationBoundary(sourceReference)
        : {});
    const [selectedRecommendationIds, setSelectedRecommendationIds] = useState(() => new Set());
    const seenRecommendationIdsRef = useRef(new Set());
    const [pickerRecommendations, setPickerRecommendations] = useState([]);
    const [openingGooglePicker, setOpeningGooglePicker] = useState(false);
    const googlePickerSession = useCreativeContextGooglePickerSession(connectorKind === "google-slides" && selectedConnectionId
        ? selectedConnectionId
        : null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const [setupError, setSetupError] = useState(null);
    const [previewSourceId, setPreviewSourceId] = useState(null);
    const [previewSourceName, setPreviewSourceName] = useState("");
    const [selectedPreviewItemIds, setSelectedPreviewItemIds] = useState(() => new Set());
    const initializedPreviewSelectionRef = useRef(null);
    const [importJobId, setImportJobId] = useState(null);
    const [importTargetScope, setImportTargetScope] = useState("user");
    const [completedJobId, setCompletedJobId] = useState(null);
    const [promotionPreview, setPromotionPreview] = useState(null);
    const [promotionSourceId, setPromotionSourceId] = useState(null);
    const [promotionMessage, setPromotionMessage] = useState(null);
    const [lifecycleMessage, setLifecycleMessage] = useState(null);
    const [deleteSource, setDeleteSource] = useState(null);
    const [hiddenSourceIds, setHiddenSourceIds] = useState(() => new Set());
    const [publishedMessage, setPublishedMessage] = useState(null);
    const [reviewSource, setReviewSource] = useState(null);
    const [reviewedItems, setReviewedItems] = useState([]);
    const [reviewError, setReviewError] = useState(null);
    const [membershipUpdateCandidate, setMembershipUpdateCandidate] = useState(null);
    const [updatingMembershipId, setUpdatingMembershipId] = useState(null);
    const [selectedPackId, setSelectedPackId] = useState(null);
    const [suggestionError, setSuggestionError] = useState(null);
    const previewQuery = usePreviewCreativeContextImport(previewSourceId);
    const importStatusQuery = useCreativeContextImportStatus(importJobId);
    const packQuery = useCreativeContextPack(selectedPackId);
    useEffect(() => setLibraryScope(scope), [scope]);
    useEffect(() => {
        if (!connectionProvider) {
            setSelectedConnectionId("");
            return;
        }
        setSelectedConnectionId(connectionsQuery.data?.autoSelectedConnectionId ?? "");
    }, [connectionProvider, connectionsQuery.data?.autoSelectedConnectionId]);
    const availableRecommendations = useMemo(() => {
        const byId = new Map();
        for (const recommendation of [
            ...(recommendationsQuery.data?.recommendations ?? []),
            ...pickerRecommendations,
        ]) {
            byId.set(recommendation.externalId, recommendation);
        }
        return [...byId.values()];
    }, [pickerRecommendations, recommendationsQuery.data?.recommendations]);
    useEffect(() => {
        const availableIds = new Set(availableRecommendations.map(({ externalId }) => externalId));
        const previouslySeen = seenRecommendationIdsRef.current;
        setSelectedRecommendationIds((current) => mergeRecommendationSelection(current, availableIds, previouslySeen));
        seenRecommendationIdsRef.current = availableIds;
    }, [availableRecommendations]);
    const sources = useMemo(() => (sourcesQuery.data?.sources ?? []).filter((source) => source.status !== "archived" &&
        !hiddenSourceIds.has(source.id) &&
        isVisibleInScope(source.visibility, libraryScope)), [hiddenSourceIds, libraryScope, sourcesQuery.data?.sources]);
    const packs = useMemo(() => (packsQuery.data?.packs ?? []).filter((pack) => !pack.archivedAt && isVisibleInScope(pack.visibility, libraryScope)), [libraryScope, packsQuery.data?.packs]);
    const contexts = useMemo(() => parseCreativeContexts(contextsQuery.data), [contextsQuery.data]);
    const selectedLibraryContextId = contextState.state.selectedContextId ?? contexts[0]?.id ?? null;
    const contextMembershipsQuery = useContextMemberships(selectedLibraryContextId ? { contextId: selectedLibraryContextId } : null);
    const manageContext = useManageCreativeContext();
    const manageContextMembership = useManageContextMembership();
    const contextMemberships = parseContextMemberships(contextMembershipsQuery.data);
    const publishedContextMemberships = contextMemberships.filter((membership) => membership.publishedItem);
    const pendingContextMemberships = contextMemberships.filter((membership) => membership.pendingSubmission);
    const selectedLibraryContext = contexts.find((context) => context.id === selectedLibraryContextId);
    const [contextSettingsName, setContextSettingsName] = useState("");
    const [contextSettingsDescription, setContextSettingsDescription] = useState("");
    const [contextSettingsPolicy, setContextSettingsPolicy] = useState("open");
    const [newContextName, setNewContextName] = useState("");
    const [newContextPolicy, setNewContextPolicy] = useState("open");
    const [contextSettingsError, setContextSettingsError] = useState(null);
    const activePack = packs.find((pack) => pack.id === contextState.state.currentPackId);
    const selectedConnector = CONNECTORS.find((connector) => connector.kind === connectorKind);
    const importJob = importStatusQuery.data?.job;
    const importResult = importJob?.result;
    const brandProposal = importResult?.inference?.brandDnaProposal;
    const brandLayoutThumbnails = selectRenderableLayoutThumbnails(brandProposal?.layoutThumbnails ?? []);
    const brandVoicePreview = brandProposal?.voiceDescriptors?.join(" · ") ?? brandProposal?.voiceLine;
    const canManageScope = libraryScope === "user" || canManageOrg;
    const canCreateContext = canManageScope && contexts.some((context) => context.access.canAdmin);
    const activeAppId = contextsQuery.data?.appId;
    const appDefaultContextId = contextsQuery.data?.appDefaultContextId ?? null;
    const canSetAppDefault = Boolean(activeAppId && selectedLibraryContext?.access.canAdmin && canManageScope);
    const proposalCapabilities = suggestionsQuery.data?.capabilities;
    const logoCandidates = proposalCapabilities?.canonicalLogo
        ? (logoCandidatesQuery.data?.candidates ?? [])
        : [];
    const proposedLayouts = (suggestionsQuery.data?.suggestions ?? []).filter((suggestion) => suggestion.kind === "layout-template" &&
        (suggestion.status === "proposed" || suggestion.status === "promoted"));
    useEffect(() => {
        setContextSettingsName(selectedLibraryContext?.name ?? "");
        setContextSettingsDescription(selectedLibraryContext?.description ?? "");
        setContextSettingsPolicy(selectedLibraryContext?.approvalPolicy ?? "open");
        setContextSettingsError(null);
    }, [selectedLibraryContext]);
    useEffect(() => {
        if (!previewSourceId || !previewQuery.data)
            return;
        const defaults = previewQuery.data.smartDefaultExternalIds ?? [];
        const initializationKey = `${previewSourceId}:${defaults.join("\u0000")}`;
        if (initializedPreviewSelectionRef.current === initializationKey)
            return;
        const discoveredIds = new Set(previewQuery.data.items.map((item) => item.externalId));
        setSelectedPreviewItemIds(new Set(defaults.filter((externalId) => discoveredIds.has(externalId))));
        initializedPreviewSelectionRef.current = initializationKey;
    }, [previewQuery.data, previewSourceId]);
    useEffect(() => {
        if (importJob?.status !== "completed" || completedJobId === importJob.id)
            return;
        setCompletedJobId(importJob.id);
        void sourcesQuery.refetch();
        void packsQuery.refetch();
        void brandProfileQuery.refetch();
        if (importTargetScope === "org" && previewSourceId) {
            setPromotionSourceId(previewSourceId);
            void manageSource
                .mutateAsync({
                operation: "preview-promotion",
                sourceId: previewSourceId,
            })
                .then((result) => setPromotionPreview(result.promotionPreview ?? null))
                .catch(() => setPromotionMessage(t("creativeContext.saveFailed")));
        }
    }, [
        brandProfileQuery,
        completedJobId,
        importJob,
        importTargetScope,
        manageSource,
        packsQuery,
        previewSourceId,
        sourcesQuery,
        t,
    ]);
    async function changeMode(mode) {
        if (mode === contextState.state.contextMode)
            return;
        setSavingState(true);
        setStateError(null);
        try {
            await contextState.setState(mode === "off"
                ? {
                    contextMode: "off",
                    selectedContextId: null,
                    currentPackId: null,
                    pinnedPackId: null,
                }
                : {
                    ...contextState.state,
                    contextMode: "auto",
                    selectedContextId: null,
                    pinnedPackId: null,
                });
        }
        catch {
            setStateError(t("creativeContext.stateSaveFailed"));
        }
        finally {
            setSavingState(false);
        }
    }
    async function changePinnedPack(packId) {
        setSavingState(true);
        setStateError(null);
        try {
            await contextState.setState({
                ...contextState.state,
                contextMode: "auto",
                selectedContextId: null,
                pinnedPackId: packId,
            });
        }
        catch {
            setStateError(t("creativeContext.stateSaveFailed"));
        }
        finally {
            setSavingState(false);
        }
    }
    async function selectContext(contextId) {
        setSavingState(true);
        setStateError(null);
        try {
            await contextState.setState({
                ...contextState.state,
                contextMode: "auto",
                selectedContextId: contextId,
                pinnedPackId: null,
            });
        }
        catch {
            setStateError(t("creativeContext.stateSaveFailed"));
        }
        finally {
            setSavingState(false);
        }
    }
    async function reviewContextMembership(membershipId, operation) {
        if (!selectedLibraryContextId)
            return;
        try {
            await manageContextMembership.mutateAsync({
                operation,
                contextId: selectedLibraryContextId,
                membershipId,
            });
            await contextMembershipsQuery.refetch();
        }
        catch {
            setReviewError(t("creativeContext.saveFailed"));
        }
    }
    async function submitLatestContextMembershipUpdate() {
        if (!selectedLibraryContextId || !membershipUpdateCandidate)
            return;
        setReviewError(null);
        setUpdatingMembershipId(membershipUpdateCandidate.id);
        try {
            await manageContextMembership.mutateAsync({
                operation: "submit-latest",
                contextId: selectedLibraryContextId,
                membershipId: membershipUpdateCandidate.id,
                confirmBroaderPublication: true,
            });
            setMembershipUpdateCandidate(null);
            await contextMembershipsQuery.refetch();
        }
        catch {
            setReviewError(t("creativeContext.submitUpdateFailed"));
        }
        finally {
            setUpdatingMembershipId(null);
        }
    }
    function refresh(sourceId) {
        setRefreshMessage(null);
        refreshSource.mutate({ sourceId, mode: "incremental" }, {
            onSuccess: () => setRefreshMessage(t("creativeContext.refreshed")),
            onError: () => setRefreshMessage(t("creativeContext.refreshFailed")),
        });
    }
    async function uploadFiles(files) {
        if (!files.length)
            return;
        setSetupError(null);
        try {
            const uploaded = await Promise.all(files.map(async (file) => {
                const relativePath = file
                    .webkitRelativePath || file.name;
                const safePath = relativePath
                    .replace(/\.\./g, "")
                    .replace(/[^a-zA-Z0-9._/-]/g, "-");
                const formData = new FormData();
                formData.append("file", file, file.name);
                formData.append("path", `/creative-context/${Date.now()}-${safePath}`);
                const resource = (await uploadResource.mutateAsync(formData));
                const url = resource.url ?? resource.content;
                if (!url)
                    throw new Error("Upload returned no file handle");
                return {
                    id: resource.id,
                    title: file.name,
                    fileName: file.name,
                    mimeType: file.type || "application/octet-stream",
                    url,
                };
            }));
            setUploadedFiles((current) => [...current, ...uploaded]);
        }
        catch {
            setSetupError(t("creativeContext.saveFailed"));
        }
    }
    function chooseFiles(event) {
        void uploadFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
    }
    function dropFiles(event) {
        event.preventDefault();
        void uploadFiles(Array.from(event.dataTransfer.files));
    }
    async function previewImport(event) {
        event.preventDefault();
        if (!selectedConnector || !sourceName.trim())
            return;
        setSetupError(null);
        setImportJobId(null);
        setCompletedJobId(null);
        setPublishedMessage(null);
        try {
            const confirmedRecommendations = availableRecommendations.filter((recommendation) => selectedRecommendationIds.has(recommendation.externalId));
            const result = await manageSource.mutateAsync({
                operation: "create",
                name: sourceName.trim(),
                kind: selectedConnector.kind,
                connectionId: selectedConnectionId || undefined,
                externalRef: selectedConnector.kind === "upload"
                    ? `${uploadedFiles.length} files`
                    : sourceReference.trim() ||
                        (confirmedRecommendations.length
                            ? `${selectedConnector.kind}:${confirmedRecommendations
                                .map((recommendation) => recommendation.externalId)
                                .join(",")}`
                            : undefined),
                config: buildCreativeContextSourceConfig(selectedConnector.kind, sourceReference, uploadedFiles, confirmedRecommendations),
            });
            if (!result.source)
                throw new Error("Source creation returned no source");
            setImportTargetScope(libraryScope);
            setPreviewSourceName(result.source.name);
            setPreviewSourceId(result.source.id);
            setSelectedPreviewItemIds(new Set());
            initializedPreviewSelectionRef.current = null;
            setPromotionSourceId(null);
            setPromotionPreview(null);
            setPromotionMessage(null);
            setConnectorKind(null);
            setSourceName("");
            setSourceReference("");
            setPickerRecommendations([]);
            seenRecommendationIdsRef.current.clear();
            setUploadedFiles([]);
            await sourcesQuery.refetch();
        }
        catch {
            setSetupError(t("creativeContext.saveFailed"));
        }
    }
    async function chooseGoogleSlides() {
        setSetupError(null);
        setOpeningGooglePicker(true);
        try {
            const session = await googlePickerSession.refetch();
            if (!session.data) {
                throw new Error("Google Picker session is unavailable.");
            }
            const selections = await chooseGoogleSlidesPresentations(session.data);
            if (!selections.length)
                return;
            const selected = selections.map((selection) => ({
                ...selection,
                provider: "google-slides",
                kind: "presentation",
            }));
            setPickerRecommendations((current) => {
                const byId = new Map(current.map((recommendation) => [
                    recommendation.externalId,
                    recommendation,
                ]));
                for (const recommendation of selected) {
                    byId.set(recommendation.externalId, recommendation);
                }
                return [...byId.values()];
            });
            setSelectedRecommendationIds((current) => {
                const next = new Set(current);
                for (const recommendation of selected) {
                    next.add(recommendation.externalId);
                }
                return next;
            });
            void recommendationsQuery.refetch();
        }
        catch (error) {
            setSetupError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setOpeningGooglePicker(false);
        }
    }
    async function confirmPromotion() {
        if (!promotionSourceId || !promotionPreview)
            return;
        setPromotionMessage(null);
        try {
            await manageSource.mutateAsync({
                operation: "promote",
                sourceId: promotionSourceId,
                confirmation: {
                    containerRef: promotionPreview.containerRef,
                    boundaryHash: promotionPreview.boundaryHash,
                    itemCount: promotionPreview.itemCount,
                },
            });
            setPromotionMessage(t("creativeContext.promotionComplete"));
            setPromotionPreview(null);
            setPromotionSourceId(null);
            await sourcesQuery.refetch();
        }
        catch {
            setPromotionMessage(t("creativeContext.saveFailed"));
        }
    }
    async function pauseSource(source) {
        setLifecycleMessage(null);
        try {
            await manageSource.mutateAsync({
                operation: "update",
                sourceId: source.id,
                patch: { status: "paused" },
            });
            setLifecycleMessage(t("creativeContext.sourcePaused"));
            await sourcesQuery.refetch();
        }
        catch {
            setLifecycleMessage(t("creativeContext.saveFailed"));
        }
    }
    async function restoreSource(source) {
        setLifecycleMessage(null);
        try {
            await manageSource.mutateAsync({
                operation: "restore",
                sourceId: source.id,
            });
            setLifecycleMessage(t("creativeContext.sourceRestored"));
            await sourcesQuery.refetch();
        }
        catch {
            setLifecycleMessage(t("creativeContext.saveFailed"));
        }
    }
    async function previewSourcePromotion(source) {
        setPromotionMessage(null);
        setPromotionPreview(null);
        setPromotionSourceId(source.id);
        try {
            const result = await manageSource.mutateAsync({
                operation: "preview-promotion",
                sourceId: source.id,
            });
            setPromotionPreview(result.promotionPreview ?? null);
        }
        catch {
            setPromotionSourceId(null);
            setPromotionMessage(t("creativeContext.saveFailed"));
        }
    }
    async function confirmDeleteSource() {
        if (!deleteSource)
            return;
        const sourceId = deleteSource.id;
        setLifecycleMessage(null);
        setDeleteSource(null);
        setHiddenSourceIds((current) => new Set(current).add(sourceId));
        try {
            await manageSource.mutateAsync({ operation: "delete", sourceId });
            setLifecycleMessage(t("creativeContext.deletionQueued"));
            void sourcesQuery.refetch();
        }
        catch {
            setHiddenSourceIds((current) => {
                const next = new Set(current);
                next.delete(sourceId);
                return next;
            });
            setLifecycleMessage(t("creativeContext.saveFailed"));
        }
    }
    async function beginImport() {
        if (!previewSourceId || !selectedPreviewItemIds.size)
            return;
        setSetupError(null);
        try {
            const result = await startImport.mutateAsync({
                sourceId: previewSourceId,
                mode: "incremental",
                itemExternalIds: (previewQuery.data?.items ?? [])
                    .map((item) => item.externalId)
                    .filter((externalId) => selectedPreviewItemIds.has(externalId)),
            });
            setImportJobId(result.job.id);
        }
        catch {
            setSetupError(t("creativeContext.importFailed"));
        }
    }
    async function publishProposal() {
        const importResult = importJob?.result;
        const proposal = importResult?.inference?.brandDnaProposal;
        if (!proposal)
            return;
        setPublishedMessage(null);
        try {
            const result = await publishBrandDna.mutateAsync({
                profileId: proposal.profileId,
                proposalVersionId: proposal.dnaVersionId,
                confirmation: {
                    proposalVersionId: proposal.dnaVersionId,
                    contentHash: proposal.contentHash,
                },
            });
            setPublishedMessage(`${t("creativeContext.brandContextPublished")} · ${result.profile.name} · v${result.dna.versionNumber}`);
            await brandProfileQuery.refetch();
        }
        catch {
            setPublishedMessage(t("creativeContext.saveFailed"));
        }
    }
    async function openItemCuration(source, queue = "all") {
        setReviewSource(source);
        setReviewError(null);
        try {
            const result = await reviewItems.mutateAsync({
                sourceId: source.id,
                operation: "list",
                queue,
                limit: 100,
            });
            setReviewedItems(result.items);
        }
        catch {
            setReviewedItems([]);
            setReviewError(t("creativeContext.unavailable"));
        }
    }
    async function reviewContextItem(operation, itemId) {
        if (!reviewSource)
            return;
        setReviewError(null);
        try {
            await reviewItems.mutateAsync({
                sourceId: reviewSource.id,
                operation,
                itemIds: [itemId],
            });
            const result = await reviewItems.mutateAsync({
                sourceId: reviewSource.id,
                operation: "list",
                queue: "all",
                limit: 100,
            });
            setReviewedItems(result.items);
            await sourcesQuery.refetch();
        }
        catch {
            setReviewError(t("creativeContext.saveFailed"));
        }
    }
    async function chooseCanonicalLogo(candidate) {
        setSuggestionError(null);
        try {
            const suggestion = await proposeCanonicalLogo.mutateAsync({
                profileId: brandProfileQuery.data?.profile?.id,
                itemId: candidate.itemId,
                itemVersionId: candidate.itemVersionId,
                reason: "Selected from the ranked Library review card",
                payload: { mediaId: candidate.mediaId },
            });
            await confirmCanonicalLogo.mutateAsync({
                suggestionId: suggestion.id,
                decision: "confirm",
            });
            await suggestionsQuery.refetch();
        }
        catch {
            setSuggestionError(t("creativeContext.saveFailed"));
        }
    }
    async function decideLayoutSuggestion(suggestionId, operation) {
        setSuggestionError(null);
        try {
            await manageLayoutTemplate.mutateAsync({ suggestionId, operation });
            await suggestionsQuery.refetch();
        }
        catch {
            setSuggestionError(t("creativeContext.saveFailed"));
        }
    }
    async function saveContextSettings() {
        if (!selectedLibraryContext?.access.canAdmin || !contextSettingsName.trim())
            return;
        setContextSettingsError(null);
        try {
            await manageContext.mutateAsync({
                operation: "update",
                contextId: selectedLibraryContext.id,
                patch: {
                    name: contextSettingsName.trim(),
                    description: contextSettingsDescription.trim() || null,
                    approvalPolicy: contextSettingsPolicy,
                },
            });
            await contextsQuery.refetch();
        }
        catch {
            setContextSettingsError("Could not update this context.");
        }
    }
    async function createSpecialtyContext() {
        if (!canCreateContext || !newContextName.trim())
            return;
        setContextSettingsError(null);
        try {
            const result = await manageContext.mutateAsync({
                operation: "create",
                name: newContextName.trim(),
                kind: "specialty",
                approvalPolicy: newContextPolicy,
            });
            setNewContextName("");
            setNewContextPolicy("open");
            await contextsQuery.refetch();
            if (result.context?.id)
                await selectContext(result.context.id);
        }
        catch {
            setContextSettingsError("Could not create this context.");
        }
    }
    async function setAppDefaultContext() {
        if (!activeAppId || !selectedLibraryContext || !canSetAppDefault)
            return;
        setContextSettingsError(null);
        try {
            await manageContext.mutateAsync({
                operation: "set-app-default",
                contextId: selectedLibraryContext.id,
                appId: activeAppId,
            });
            await contextsQuery.refetch();
        }
        catch {
            setContextSettingsError("Could not update the automatic context for this app.");
        }
    }
    async function search(event) {
        event.preventDefault();
        const searchText = query.trim();
        if (!searchText ||
            (!sources.length &&
                !selectedLibraryContextId &&
                !contextState.state.pinnedPackId))
            return;
        setSearchError(null);
        try {
            const result = await searchContext.mutateAsync({
                query: searchText,
                sourceIds: selectedLibraryContextId || contextState.state.pinnedPackId
                    ? undefined
                    : sources.map((source) => source.id),
                packId: contextState.state.pinnedPackId ?? undefined,
                contextId: contextState.state.pinnedPackId
                    ? undefined
                    : (selectedLibraryContextId ?? undefined),
                limit: 20,
                snapshot: true,
            });
            if (result.contextPackId && contextState.state.contextMode === "auto") {
                await contextState.setState({
                    ...contextState.state,
                    currentPackId: result.contextPackId,
                });
            }
        }
        catch {
            setSearchError(t("creativeContext.unavailable"));
        }
    }
    const loading = sourcesQuery.isLoading ||
        packsQuery.isLoading ||
        contextsQuery.isLoading ||
        contextState.isLoading;
    const unavailable = sourcesQuery.error || packsQuery.error || contextsQuery.error;
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col gap-7 p-6 lg:p-10", children: [_jsxs("header", { className: "flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: t("creativeContext.title") }), _jsx("p", { className: "mt-1 max-w-2xl text-sm text-muted-foreground", children: t("creativeContext.description") })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [scopeControl ??
                                (org?.orgId ? (_jsx(ScopeControl, { scope: libraryScope, onChange: setLibraryScope })) : null), _jsx(CreativeContextChip, { state: contextState.state, packs: packs, contexts: contexts })] })] }), loading ? (_jsxs("div", { className: "space-y-3", "aria-label": t("creativeContext.loading"), children: [_jsx(Skeleton, { className: "h-24 w-full" }), _jsx(Skeleton, { className: "h-40 w-full" }), _jsx(Skeleton, { className: "h-32 w-full" })] })) : unavailable ? (_jsxs("div", { className: "flex items-center gap-3 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground", children: [_jsx(IconAlertTriangle, { className: "size-5" }), t("creativeContext.unavailable")] })) : (_jsxs(_Fragment, { children: [_jsx(ContextRail, { contexts: contexts, selectedContextId: contextState.state.selectedContextId, disabled: savingState, canCreate: canCreateContext, onSelect: (contextId) => void selectContext(contextId), onCreate: () => setLibraryView("settings") }), _jsxs(Tabs, { value: libraryView, onValueChange: (value) => setLibraryView(value), children: [_jsxs(TabsList, { className: "w-full justify-start overflow-x-auto", children: [_jsx(TabsTrigger, { value: "items", children: "Items" }), _jsx(TabsTrigger, { value: "sources", children: "Sources" }), _jsx(TabsTrigger, { value: "approvals", children: "Approvals" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" })] }), _jsxs(TabsContent, { value: "items", children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: publishedContextMemberships.map((membership) => {
                                            const item = membership.publishedItem;
                                            const imageMedium = item.media.find((medium) => medium.mimeType?.startsWith("image/"));
                                            const playbackMedium = item.media.find((medium) => medium.mimeType?.startsWith("video/"));
                                            const medium = imageMedium ?? playbackMedium ?? item.media[0];
                                            const sheetMedium = playbackMedium ?? medium;
                                            const updateAvailable = membership.nativeUpdateStatus?.state === "update-available";
                                            return (_jsxs("article", { className: "overflow-hidden rounded-md border border-border", children: [_jsxs("button", { type: "button", onClick: () => setPreviewManifest({
                                                            title: item.title,
                                                            kind: item.kind,
                                                            itemId: item.id,
                                                            itemVersionId: item.itemVersionId,
                                                            preview: item.preview,
                                                            media: sheetMedium ?? null,
                                                            gallery: item.media.filter((candidate) => candidate.mimeType?.startsWith("image/")),
                                                            posterUrl: playbackMedium && imageMedium
                                                                ? imageMedium.url
                                                                : undefined,
                                                        }), className: "block w-full text-start transition-colors hover:bg-accent/40", children: [_jsx("span", { className: "block aspect-video overflow-hidden", children: _jsx(ContextPreviewVisual, { compact: true, manifest: {
                                                                        title: item.title,
                                                                        kind: item.kind,
                                                                        itemId: item.id,
                                                                        itemVersionId: item.itemVersionId,
                                                                        preview: item.preview,
                                                                        media: medium ?? null,
                                                                        gallery: item.media,
                                                                    } }) }), _jsxs("span", { className: "block p-3", children: [_jsx("span", { className: "block truncate text-sm font-medium", children: item.title }), _jsxs("span", { className: "mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground", children: [_jsx("span", { children: item.kind }), _jsx("span", { children: "\u00B7" }), _jsx("span", { className: "capitalize", children: membership.rank }), _jsx(Badge, { variant: "secondary", children: "Published" }), updateAvailable ? (_jsx(Badge, { variant: "outline", children: t("creativeContext.updateAvailable") })) : null] }), _jsxs("span", { className: "mt-1 block truncate font-mono text-[10px] text-muted-foreground", children: ["Version ", item.itemVersionId.slice(0, 12)] })] })] }), updateAvailable &&
                                                        selectedLibraryContext?.access.canSubmit ? (_jsx("div", { className: "border-t border-border/70 p-2", children: _jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "w-full", disabled: updatingMembershipId === membership.id, onClick: () => setMembershipUpdateCandidate({
                                                                id: membership.id,
                                                                title: item.title,
                                                            }), children: [_jsx(IconRefresh, {}), updatingMembershipId === membership.id
                                                                    ? t("creativeContext.submittingUpdate")
                                                                    : t("creativeContext.submitUpdate")] }) })) : null] }, membership.id));
                                        }) }), !publishedContextMemberships.length ? (_jsx("p", { className: "py-4 text-sm text-muted-foreground", children: "Approved context items appear here after publication." })) : null, reviewError ? (_jsx("p", { className: "mt-3 text-sm text-destructive", children: reviewError })) : null] }), _jsxs(TabsContent, { value: "approvals", children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: pendingContextMemberships.map((membership) => {
                                            const submission = membership.pendingSubmission;
                                            const item = submission.proposedItem;
                                            const medium = item?.media[0];
                                            return (_jsxs("article", { className: "overflow-hidden rounded-md border border-border", children: [item ? (_jsx("button", { type: "button", className: "block aspect-video w-full overflow-hidden text-start", onClick: () => setPreviewManifest({
                                                            title: item.title,
                                                            kind: item.kind,
                                                            itemId: item.id,
                                                            itemVersionId: item.itemVersionId,
                                                            preview: item.preview,
                                                            media: medium ?? null,
                                                            gallery: item.media.filter((candidate) => candidate.mimeType?.startsWith("image/")),
                                                        }), children: _jsx(ContextPreviewVisual, { compact: true, manifest: {
                                                                title: item.title,
                                                                kind: item.kind,
                                                                itemId: item.id,
                                                                itemVersionId: item.itemVersionId,
                                                                preview: item.preview,
                                                                media: medium ?? null,
                                                            } }) })) : null, _jsxs("div", { className: "p-3", children: [_jsx("p", { className: "truncate text-sm font-medium", children: item?.title ?? "Pending context submission" }), _jsxs("p", { className: "mt-0.5 text-xs text-muted-foreground", children: ["Submitted by ", submission.submittedBy] }), submission.note ? (_jsx("p", { className: "mt-2 line-clamp-3 text-xs text-muted-foreground", children: submission.note })) : null, selectedLibraryContext?.access.canReview ? (_jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx(Button, { size: "sm", onClick: () => void reviewContextMembership(membership.id, "approve"), children: "Approve" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => void reviewContextMembership(membership.id, "request-changes"), children: "Request changes" })] })) : (_jsx(Badge, { variant: "outline", className: "mt-3", children: "Awaiting review" }))] })] }, membership.id));
                                        }) }), !pendingContextMemberships.length ? (_jsx("p", { className: "py-4 text-sm text-muted-foreground", children: "No context submissions need review." })) : null] }), _jsx(TabsContent, { value: "sources", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Sources and their review queues are managed below." }) }), _jsxs(TabsContent, { value: "settings", children: [_jsxs("div", { className: "grid gap-5 lg:grid-cols-2", children: [_jsxs("section", { className: "space-y-3 rounded-md border border-border p-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: "Context settings" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Automatic selection uses Default plus at most one matching specialty. Exact packs remain available under advanced provenance." })] }), _jsx(Input, { value: contextSettingsName, disabled: !selectedLibraryContext?.access.canAdmin, onChange: (event) => setContextSettingsName(event.target.value), placeholder: "Context name" }), _jsx(Textarea, { value: contextSettingsDescription, disabled: !selectedLibraryContext?.access.canAdmin, onChange: (event) => setContextSettingsDescription(event.target.value), placeholder: "When should agents use this context?", rows: 3 }), _jsxs(Select, { value: contextSettingsPolicy, disabled: !selectedLibraryContext?.access.canAdmin, onValueChange: (value) => setContextSettingsPolicy(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "open", children: "Open publishing" }), _jsx(SelectItem, { value: "review", children: "Require review" }), _jsx(SelectItem, { value: "admins-only", children: "Admins only" })] })] }), _jsx(Button, { type: "button", size: "sm", disabled: !selectedLibraryContext?.access.canAdmin ||
                                                            !contextSettingsName.trim() ||
                                                            manageContext.isPending, onClick: () => void saveContextSettings(), children: "Save settings" }), activeAppId ? (_jsxs("div", { className: "border-t border-border/70 pt-3", children: [_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Automatic generations use Default plus this context for", ` ${activeAppId}`, " when no context is chosen explicitly."] }), _jsx(Button, { type: "button", size: "sm", variant: "outline", className: "mt-3", disabled: !canSetAppDefault ||
                                                                    appDefaultContextId === selectedLibraryContext?.id ||
                                                                    manageContext.isPending, onClick: () => void setAppDefaultContext(), children: appDefaultContextId === selectedLibraryContext?.id
                                                                    ? `Automatic for ${activeAppId}`
                                                                    : `Use automatically for ${activeAppId}` })] })) : null] }), _jsxs("section", { className: "space-y-3 rounded-md border border-dashed border-border p-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: "New specialty" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Create a focused style such as Marketing, Product, or Sales. Contexts start open unless you choose review." })] }), _jsx(Input, { value: newContextName, disabled: !canCreateContext, onChange: (event) => setNewContextName(event.target.value), placeholder: "Marketing" }), _jsxs(Select, { value: newContextPolicy, disabled: !canCreateContext, onValueChange: (value) => setNewContextPolicy(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "open", children: "Open publishing" }), _jsx(SelectItem, { value: "review", children: "Require review" }), _jsx(SelectItem, { value: "admins-only", children: "Admins only" })] })] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", disabled: !canCreateContext ||
                                                            !newContextName.trim() ||
                                                            manageContext.isPending, onClick: () => void createSpecialtyContext(), children: [_jsx(IconPlus, {}), " Create context"] })] })] }), contextSettingsError ? (_jsx("p", { className: "mt-3 text-xs text-destructive", children: contextSettingsError })) : null] })] }), libraryView === "settings" ? (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold", children: t("creativeContext.modeLabel") }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: activePack
                                            ? `${t("creativeContext.activePack")}: ${activePack.name}`
                                            : t("creativeContext.noActivePack") })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", role: "radiogroup", children: [_jsx(ContextModeButton, { mode: "auto", activeMode: contextState.state.contextMode, label: t("creativeContext.automatic"), description: t("creativeContext.automaticDescription"), disabled: savingState, onSelect: (mode) => void changeMode(mode) }), _jsx(ContextModeButton, { mode: "off", activeMode: contextState.state.contextMode, label: t("creativeContext.off"), description: t("creativeContext.offDescription"), disabled: savingState, onSelect: (mode) => void changeMode(mode) })] }), stateError ? (_jsx("p", { className: "text-xs text-destructive", children: stateError })) : null] })) : null, libraryView === "settings" &&
                        brandProfileQuery.data?.profile &&
                        brandProfileQuery.data.dna ? (_jsx("section", { className: "border-t border-border/70 pt-6", children: _jsxs("div", { className: "rounded-md border border-border p-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold", children: t("creativeContext.publishedBrandContext") }), _jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: brandProfileQuery.data.profile.name })] }), _jsxs(Badge, { variant: "secondary", children: ["v", brandProfileQuery.data.dna.versionNumber] })] }), _jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: brandProfileQuery.data.dna.payload.summary })] }) })) : null, libraryView === "approvals" &&
                        (logoCandidates.length || proposedLayouts.length) ? (_jsxs("section", { className: "border-t border-border/70 pt-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconSparkles, { className: "size-5 text-muted-foreground" }), _jsx("h2", { className: "text-lg font-semibold", children: t("creativeContext.suggestions") })] }), logoCandidates.length ? (_jsxs("div", { className: "mt-4", children: [_jsxs("h3", { className: "flex items-center gap-2 text-sm font-semibold", children: [_jsx(IconPhoto, { className: "size-4 text-muted-foreground" }), t("creativeContext.logo")] }), _jsx("div", { className: "mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: logoCandidates.map((candidate) => (_jsxs("article", { className: "overflow-hidden rounded-md border border-border", children: [_jsx("div", { className: "flex h-28 items-center justify-center bg-muted/40 p-3", children: _jsx("img", { src: candidate.thumbnailUrl, alt: candidate.title, className: "max-h-full max-w-full object-contain" }) }), _jsxs("div", { className: "flex items-center justify-between gap-2 p-3", children: [_jsx("p", { className: "min-w-0 truncate text-sm font-medium", children: candidate.title }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", disabled: proposeCanonicalLogo.isPending ||
                                                                confirmCanonicalLogo.isPending, onClick: () => void chooseCanonicalLogo(candidate), children: [_jsx(IconCheck, {}), t("creativeContext.approve")] })] })] }, candidate.mediaId))) })] })) : null, proposedLayouts.length &&
                                proposalCapabilities?.layoutTemplate ? (_jsxs("div", { className: "mt-5", children: [_jsxs("h3", { className: "flex items-center gap-2 text-sm font-semibold", children: [_jsx(IconLayout, { className: "size-4 text-muted-foreground" }), t("creativeContext.layouts")] }), _jsx("div", { className: "mt-2 divide-y divide-border/70 rounded-md border border-border", children: proposedLayouts.map((suggestion) => (_jsxs("article", { className: "flex flex-wrap items-center justify-between gap-3 p-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-medium", children: suggestion.reason ?? suggestion.itemId }), _jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: suggestion.status })] }), _jsx("div", { className: "flex items-center gap-2", children: suggestion.status === "proposed" ? (_jsxs(_Fragment, { children: [_jsxs(Button, { type: "button", size: "sm", disabled: manageLayoutTemplate.isPending, onClick: () => void decideLayoutSuggestion(suggestion.id, "promote"), children: [_jsx(IconCheck, {}), t("creativeContext.approve")] }), _jsx(Button, { type: "button", size: "sm", variant: "outline", disabled: manageLayoutTemplate.isPending, onClick: () => void decideLayoutSuggestion(suggestion.id, "reject"), children: t("creativeContext.exclude") })] })) : (_jsx(Button, { type: "button", size: "sm", variant: "outline", disabled: manageLayoutTemplate.isPending, onClick: () => void decideLayoutSuggestion(suggestion.id, "demote"), children: t("creativeContext.deprecate") })) })] }, suggestion.id))) })] })) : null, suggestionError ? (_jsx("p", { className: "mt-3 text-sm text-destructive", children: suggestionError })) : null] })) : null, libraryView === "sources" ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "border-t border-border/70 pt-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold", children: t("creativeContext.addSource") }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: t("creativeContext.sourcesDescription") })] }), _jsx("div", { className: "mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5", children: CONNECTORS.map((connector) => {
                                            const Icon = connector.icon;
                                            return (_jsxs("button", { type: "button", disabled: !canManageScope, onClick: () => {
                                                    setConnectorKind(connector.kind);
                                                    setSourceName(connector.label);
                                                    setSourceReference("");
                                                    setUploadedFiles([]);
                                                    setPickerRecommendations([]);
                                                    seenRecommendationIdsRef.current.clear();
                                                    setSelectedConnectionId("");
                                                    setSelectedRecommendationIds(new Set());
                                                    setSetupError(null);
                                                }, className: "flex min-h-24 flex-col items-start justify-between rounded-md border border-border p-3 text-start transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50", children: [_jsx(Icon, { className: "size-5 text-muted-foreground" }), _jsx("span", { className: "text-sm font-medium", children: connector.label })] }, connector.kind));
                                        }) }), selectedConnector ? (_jsxs("form", { className: "mt-4 rounded-md border border-border p-4", onSubmit: (event) => void previewImport(event), children: [connectionProvider ? (_jsx("div", { className: "mb-3", children: connectionsQuery.isLoading ? (_jsx(Skeleton, { className: "h-9 w-full" })) : connectionsQuery.data?.needsSetup ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground", children: [_jsx("span", { children: t("creativeContext.setupConnection") }), _jsx(Button, { asChild: true, type: "button", variant: "outline", size: "sm", children: _jsxs("a", { href: connectionsQuery.data.connectPath ||
                                                                    connectionsQuery.data.connectionsPath ||
                                                                    connectionsHref, children: [t("creativeContext.connectProvider"), _jsx(IconArrowUpRight, {})] }) })] })) : connectionsQuery.data?.needsPicker ? (_jsxs("label", { className: "block space-y-1.5 text-xs font-medium", children: [_jsx("span", { children: t("creativeContext.chooseConnection") }), _jsxs(Select, { value: selectedConnectionId, onValueChange: setSelectedConnectionId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t("creativeContext.chooseConnection") }) }), _jsx(SelectContent, { children: connectionsQuery.data.connections.map((connection) => (_jsx(SelectItem, { value: connection.connectionId, children: connection.label }, connection.connectionId))) })] })] })) : null })) : null, recommendationProvider && selectedConnectionId ? (_jsxs("div", { className: "mb-3 rounded-md border border-border p-3", children: [connectorKind === "google-slides" ? (_jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3", children: [_jsx("p", { className: "max-w-lg text-xs text-muted-foreground", children: t("creativeContext.googlePickerDescription") }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: openingGooglePicker, onClick: () => void chooseGoogleSlides(), children: [_jsx(IconSlideshow, {}), openingGooglePicker
                                                                        ? t("creativeContext.loading")
                                                                        : t("creativeContext.choosePresentations")] })] })) : null, recommendationsQuery.isLoading &&
                                                        !availableRecommendations.length ? (_jsx(Skeleton, { className: "h-16 w-full" })) : availableRecommendations.length ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 text-xs text-muted-foreground", children: [_jsx("span", { children: t("creativeContext.discoveredItems", {
                                                                            count: formatNumber(availableRecommendations.length),
                                                                        }) }), _jsx("span", { children: t("creativeContext.selectedItems", {
                                                                            count: formatNumber(selectedRecommendationIds.size),
                                                                        }) })] }), _jsx("div", { className: "max-h-52 divide-y divide-border/60 overflow-y-auto", children: availableRecommendations.map((recommendation) => (_jsxs("label", { className: "flex cursor-pointer items-start gap-3 py-2", children: [_jsx(Checkbox, { className: "mt-0.5", checked: selectedRecommendationIds.has(recommendation.externalId), onCheckedChange: (checked) => setSelectedRecommendationIds((current) => {
                                                                                const next = new Set(current);
                                                                                if (checked) {
                                                                                    next.add(recommendation.externalId);
                                                                                }
                                                                                else {
                                                                                    next.delete(recommendation.externalId);
                                                                                }
                                                                                return next;
                                                                            }) }), _jsxs("span", { className: "min-w-0", children: [_jsx("span", { className: "block truncate text-sm", children: recommendation.title }), _jsx("span", { className: "block text-xs text-muted-foreground", children: recommendation.containerRef ??
                                                                                        recommendation.kind })] })] }, recommendation.externalId))) })] })) : (_jsx("p", { className: "text-xs text-muted-foreground", children: recommendationsQuery.data?.unavailableReason ??
                                                            t("creativeContext.unavailable") }))] })) : null, _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "space-y-1.5 text-xs font-medium", children: [_jsx("span", { children: t("creativeContext.sourceName") }), _jsx(Input, { value: sourceName, onChange: (event) => setSourceName(event.target.value), required: true })] }), selectedConnector.kind === "upload" ? (_jsxs("div", { className: "space-y-1.5 text-xs font-medium", children: [_jsx("span", { children: t("creativeContext.sourceReference") }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: ".pptx,.docx,.pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,image/gif,image/svg+xml", className: "hidden", onChange: chooseFiles }), _jsx("input", { ref: folderInputRef, type: "file", multiple: true, className: "hidden", onChange: chooseFiles, ...{ webkitdirectory: "", directory: "" } }), _jsxs("div", { onDragOver: (event) => event.preventDefault(), onDrop: dropFiles, className: "rounded-md border border-dashed border-border p-4", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: t("creativeContext.dropFiles") }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => fileInputRef.current?.click(), children: t("creativeContext.chooseFiles") }), _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => folderInputRef.current?.click(), children: t("creativeContext.chooseFolder") })] }), uploadedFiles.length ? (_jsx("ul", { className: "mt-3 space-y-1 text-xs text-muted-foreground", children: uploadedFiles.map((file) => (_jsx("li", { className: "truncate", children: file.fileName }, file.id))) })) : null] })] })) : (_jsxs("label", { className: "space-y-1.5 text-xs font-medium", children: [_jsx("span", { children: t("creativeContext.sourceReference") }), selectedConnector.kind === "website" ||
                                                                selectedConnector.kind === "figma" ||
                                                                selectedConnector.kind === "notion" ? (_jsx(Textarea, { value: sourceReference, onChange: (event) => setSourceReference(event.target.value), placeholder: selectedConnector.referencePlaceholder, required: selectedConnector.referenceRequired, rows: 3 })) : (_jsx(Input, { value: sourceReference, onChange: (event) => setSourceReference(event.target.value), placeholder: selectedConnector.referencePlaceholder, required: selectedConnector.referenceRequired }))] }))] }), _jsxs("div", { className: "mt-3 flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "ghost", onClick: () => setConnectorKind(null), children: t("creativeContext.cancel") }), _jsxs(Button, { type: "submit", disabled: manageSource.isPending ||
                                                            uploadResource.isPending ||
                                                            (selectedConnector.kind === "upload" &&
                                                                !uploadedFiles.length) ||
                                                            (Boolean(connectionProvider) &&
                                                                !selectedConnectionId) ||
                                                            (selectedConnector.referenceRequired &&
                                                                !sourceReference.trim()) ||
                                                            (Boolean(recommendationProvider) &&
                                                                !sourceReference.trim() &&
                                                                !selectedRecommendationIds.size), children: [_jsx(IconFileImport, {}), t("creativeContext.preview")] })] })] })) : null, previewSourceId ? (_jsxs("div", { className: "mt-4 rounded-md border border-border p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: previewSourceName }), previewQuery.isLoading ? (_jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: t("creativeContext.loading") })) : (_jsxs("div", { className: "mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground", children: [_jsx("span", { children: t("creativeContext.discoveredItems", {
                                                                            count: formatNumber(previewQuery.data?.total ??
                                                                                previewQuery.data?.items.length ??
                                                                                0),
                                                                        }) }), _jsx("span", { children: t("creativeContext.selectedItems", {
                                                                            count: formatNumber(selectedPreviewItemIds.size),
                                                                        }) })] }))] }), _jsxs(Button, { type: "button", disabled: previewQuery.isLoading ||
                                                            !previewQuery.data?.items.length ||
                                                            !selectedPreviewItemIds.size ||
                                                            startImport.isPending ||
                                                            importJob?.status === "queued" ||
                                                            importJob?.status === "running", onClick: () => void beginImport(), children: [_jsx(IconFileImport, {}), startImport.isPending
                                                                ? t("creativeContext.importing")
                                                                : t("creativeContext.startImport")] })] }), previewQuery.data?.items.length ? (_jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center gap-2 border-y border-border/60 py-2", children: [_jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setSelectedPreviewItemIds(new Set(previewQuery.data?.items.map((item) => item.externalId) ?? [])), children: t("creativeContext.selectAll") }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setSelectedPreviewItemIds(new Set()), children: t("creativeContext.clearSelection") })] }), _jsx("div", { className: "max-h-80 divide-y divide-border/60 overflow-y-auto", children: previewQuery.data.items.map((item) => (_jsxs("label", { className: "flex cursor-pointer items-start gap-3 py-2", children: [_jsx(Checkbox, { className: "mt-0.5", checked: selectedPreviewItemIds.has(item.externalId), onCheckedChange: (checked) => setSelectedPreviewItemIds((current) => {
                                                                        const next = new Set(current);
                                                                        if (checked)
                                                                            next.add(item.externalId);
                                                                        else
                                                                            next.delete(item.externalId);
                                                                        return next;
                                                                    }) }), _jsxs("span", { className: "min-w-0", children: [_jsx("span", { className: "block truncate text-sm", children: item.title }), _jsx("span", { className: "block text-xs text-muted-foreground", children: item.kind })] })] }, item.externalId))) })] })) : null] })) : null, importJob ? (_jsxs("div", { className: "mt-4 rounded-md border border-border p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [importJob.status === "completed" ? (_jsx(IconCheck, { className: "size-5 text-emerald-600" })) : importJob.status === "failed" ? (_jsx(IconAlertTriangle, { className: "size-5 text-destructive" })) : (_jsx(IconRefresh, { className: "size-5 animate-spin text-muted-foreground" })), _jsx("h3", { className: "text-sm font-semibold", children: importJob.status === "completed"
                                                            ? t("creativeContext.importComplete")
                                                            : importJob.status === "failed"
                                                                ? t("creativeContext.importFailed")
                                                                : t("creativeContext.importing") })] }), importJob.status === "completed" && brandProposal ? (_jsx("div", { className: "mt-4 rounded-md bg-muted/50 p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(IconSparkles, { className: "mt-0.5 size-5 text-muted-foreground" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h4", { className: "text-sm font-semibold", children: t("creativeContext.brandDnaTitle") }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: brandProposal.summary }), brandProposal.colors.length ? (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-xs font-medium", children: t("creativeContext.colors") }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: brandProposal.colors.map((color) => (_jsxs("div", { className: "flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-xs", children: [_jsx("span", { className: "size-4 rounded-sm border border-black/10", style: { backgroundColor: color } }), color] }, color))) })] })) : null, brandProposal.fonts.length ? (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-xs font-medium", children: t("creativeContext.fonts") }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: brandProposal.fonts.map((font) => (_jsx(Badge, { variant: "outline", children: font }, font))) })] })) : null, brandLayoutThumbnails.length ? (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-xs font-medium", children: t("creativeContext.layouts") }), _jsx("div", { className: "mt-2 grid grid-cols-3 gap-2", children: brandLayoutThumbnails.map((thumbnail) => (_jsx(AccessScopedThumbnail, { itemId: thumbnail.itemId, itemVersionId: thumbnail.itemVersionId, className: "aspect-video w-full rounded border border-border object-cover" }, thumbnail.itemVersionId))) })] })) : null, brandVoicePreview ? (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-xs font-medium", children: t("creativeContext.voice") }), _jsx("blockquote", { className: "mt-1 border-s-2 border-border ps-3 text-sm text-muted-foreground", children: brandVoicePreview })] })) : null, _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsxs(Button, { type: "button", disabled: publishBrandDna.isPending, onClick: () => void publishProposal(), children: [_jsx(IconSparkles, {}), publishBrandDna.isPending
                                                                                    ? t("creativeContext.applyingBrandContext")
                                                                                    : t("creativeContext.applyBrandContext")] }), _jsx(Button, { asChild: true, type: "button", variant: "outline", children: _jsxs("a", { href: "/settings/agent", children: [t("creativeContext.generateWithContext"), _jsx(IconArrowUpRight, {})] }) })] }), publishedMessage ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: publishedMessage })) : null] })] }) })) : importJob.error ? (_jsx("p", { className: "mt-2 text-sm text-destructive", children: importJob.error })) : (_jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [formatNumber(importJob.progressCurrent), " /", " ", formatNumber(importJob.progressTotal ?? 0)] }))] })) : null, promotionPreview ? (_jsxs("div", { className: "mt-4 rounded-md border border-border p-4", children: [_jsx("h3", { className: "text-sm font-semibold", children: t("creativeContext.promoteToOrganization") }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: t("creativeContext.promotionDescription") }), _jsxs("dl", { className: "mt-3 grid gap-2 text-xs sm:grid-cols-3", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-muted-foreground", children: t("creativeContext.sourceReference") }), _jsx("dd", { className: "mt-0.5 truncate font-medium", children: promotionPreview.containerRef })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-muted-foreground", children: t("creativeContext.itemsLabel", { count: "" }) }), _jsx("dd", { className: "mt-0.5 font-medium", children: formatNumber(promotionPreview.itemCount) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-muted-foreground", children: t("creativeContext.restrictedItems", { count: "" }) }), _jsx("dd", { className: "mt-0.5 font-medium", children: formatNumber(promotionPreview.restrictedItemCount) })] })] }), _jsx(Button, { type: "button", className: "mt-4", disabled: manageSource.isPending, onClick: () => void confirmPromotion(), children: t("creativeContext.promoteToOrganization") })] })) : null, promotionMessage ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: promotionMessage })) : null, setupError ? (_jsx("p", { className: "mt-2 text-sm text-destructive", children: setupError })) : null] }), _jsxs("section", { className: "border-t border-border/70 pt-6", children: [_jsx("h2", { className: "text-lg font-semibold", children: t("creativeContext.sourcesTitle") }), sources.length ? (_jsx("div", { className: "mt-3", children: sources.map((source) => (_jsx(SourceRow, { source: source, refreshing: refreshSource.isPending &&
                                                refreshSource.variables?.sourceId === source.id, canReview: canManageScope, canPromote: libraryScope === "user" &&
                                                Boolean(org?.orgId) &&
                                                canManageOrg &&
                                                source.visibility === "private", onRefresh: refresh, onReview: (selected) => void openItemCuration(selected, "restricted"), onCurate: (selected) => void openItemCuration(selected), onPromote: (selected) => void previewSourcePromotion(selected), onPause: (selected) => void pauseSource(selected), onRestore: (selected) => void restoreSource(selected), onDelete: setDeleteSource }, source.id))) })) : (_jsxs("div", { className: "mt-4 rounded-md border border-dashed border-border p-6 text-center", children: [_jsx(IconBooks, { className: "mx-auto size-7 text-muted-foreground" }), _jsx("h3", { className: "mt-3 text-sm font-semibold", children: t("creativeContext.noSourcesTitle") }), _jsx("p", { className: "mx-auto mt-1 max-w-md text-sm text-muted-foreground", children: t("creativeContext.noSourcesDescription") }), _jsx(Button, { asChild: true, variant: "outline", size: "sm", className: "mt-4", children: _jsxs("a", { href: connectionsHref, children: [t("creativeContext.connectSources"), _jsx(IconArrowUpRight, {})] }) })] })), reviewSource ? (_jsx(ItemCuration, { source: reviewSource, items: reviewedItems, busy: reviewItems.isPending, onReview: (operation, itemId) => void reviewContextItem(operation, itemId), onClose: () => {
                                            setReviewSource(null);
                                            setReviewedItems([]);
                                        } })) : null, reviewError ? (_jsx("p", { className: "mt-2 text-sm text-destructive", children: reviewError })) : null, refreshMessage ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: refreshMessage })) : null, lifecycleMessage ? (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: lifecycleMessage })) : null] })] })) : null, libraryView === "settings" ? (_jsxs("section", { className: "border-t border-border/70 pt-6", children: [_jsx("h2", { className: "text-lg font-semibold", children: t("creativeContext.packsTitle") }), packs.length ? (_jsx("div", { className: "mt-3", children: packs.map((pack) => (_jsx(PackRow, { pack: pack, pinned: contextState.state.pinnedPackId === pack.id, disabled: savingState, onPin: (packId) => void changePinnedPack(packId), onDetails: setSelectedPackId }, pack.id))) })) : (_jsx("p", { className: "mt-3 rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground", children: t("creativeContext.noPacks") })), selectedPackId ? (_jsxs("div", { className: "mt-4 rounded-md border border-border p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: packQuery.data?.pack?.name ??
                                                            t("creativeContext.packDetails") }), packQuery.data?.pack?.derivedFromPackId ? (_jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [t("creativeContext.influence"), ":", " ", packQuery.data.pack.derivedFromPackId] })) : null] }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setSelectedPackId(null), children: t("creativeContext.cancel") })] }), packQuery.data?.pack?.members.length ? (_jsx("div", { className: "mt-3 divide-y divide-border/60", children: packQuery.data.pack.members.map((member) => (_jsxs("div", { className: "py-2 text-xs", children: [_jsx("p", { className: "font-medium", children: member.itemId }), member.reason ? (_jsxs("p", { className: "mt-0.5 text-muted-foreground", children: [t("creativeContext.influence"), ": ", member.reason] })) : null] }, member.id))) })) : null] })) : null] })) : null, libraryView === "items" ? (_jsxs("section", { className: "border-t border-border/70 pt-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold", children: t("creativeContext.searchTitle") }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: t("creativeContext.searchDescription") })] }), _jsxs("form", { className: "mt-4 flex gap-2", onSubmit: (event) => void search(event), children: [_jsxs("div", { className: "relative min-w-0 flex-1", children: [_jsx(IconSearch, { className: "pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("creativeContext.searchPlaceholder"), "aria-label": t("creativeContext.searchPlaceholder"), className: "ps-9" })] }), _jsxs(Button, { type: "submit", variant: "outline", disabled: !query.trim() ||
                                            (!sources.length &&
                                                !selectedLibraryContextId &&
                                                !contextState.state.pinnedPackId) ||
                                            searchContext.isPending, children: [_jsx(IconSearch, {}), t("creativeContext.searchTitle")] })] }), searchError ? (_jsx("p", { className: "mt-4 text-sm text-destructive", children: searchError })) : !searchContext.data && !searchContext.isPending ? (_jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: t("creativeContext.searchPrompt") })) : searchContext.isPending ? (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsx(Skeleton, { className: "h-20 w-full" }), _jsx(Skeleton, { className: "h-20 w-full" })] })) : searchContext.data?.results.length ? (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: t("creativeContext.resultsLabel", {
                                            count: formatNumber(searchContext.data.results.length),
                                        }) }), searchContext.data.results.map((result) => (_jsxs("article", { className: "rounded-md border border-border/70 p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "truncate text-sm font-medium", children: result.title }), _jsxs("p", { className: "mt-0.5 text-xs text-muted-foreground", children: [result.sourceName, " \u00B7 ", result.kind] })] }), result.canonicalUrl ? (_jsx(Button, { asChild: true, variant: "ghost", size: "icon", children: _jsx("a", { href: result.canonicalUrl, target: "_blank", rel: "noreferrer", "aria-label": result.title, children: _jsx(IconArrowUpRight, {}) }) })) : null] }), _jsx("p", { className: "mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground", children: result.excerpt })] }, `${result.itemVersionId}:${result.chunkId ?? "item"}`)))] })) : (_jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: t("creativeContext.noResults") }))] })) : null] })), _jsx(ContextPreviewSheet, { manifest: previewManifest, onOpenChange: (open) => {
                    if (!open)
                        setPreviewManifest(null);
                } }), _jsx(AlertDialog, { open: Boolean(membershipUpdateCandidate), onOpenChange: (open) => {
                    if (!open && !updatingMembershipId)
                        setMembershipUpdateCandidate(null);
                }, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t("creativeContext.submitUpdateTitle") }), _jsx(AlertDialogDescription, { children: t("creativeContext.submitUpdateDescription", {
                                        name: membershipUpdateCandidate?.title ?? "",
                                    }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: Boolean(updatingMembershipId), children: t("creativeContext.cancel") }), _jsx(AlertDialogAction, { disabled: Boolean(updatingMembershipId), onClick: (event) => {
                                        event.preventDefault();
                                        void submitLatestContextMembershipUpdate();
                                    }, children: updatingMembershipId
                                        ? t("creativeContext.submittingUpdate")
                                        : t("creativeContext.submitUpdate") })] })] }) }), _jsx(AlertDialog, { open: Boolean(deleteSource), onOpenChange: (open) => {
                    if (!open)
                        setDeleteSource(null);
                }, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t("creativeContext.deleteSourceTitle") }), _jsx(AlertDialogDescription, { children: t("creativeContext.deleteSourceDescription", {
                                        name: deleteSource?.name ?? "",
                                    }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t("creativeContext.cancel") }), _jsx(AlertDialogAction, { className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", onClick: () => void confirmDeleteSource(), children: t("creativeContext.delete") })] })] }) })] }));
}
//# sourceMappingURL=CreativeContextPanel.js.map