import { useActionMutation, useActionQuery, } from "@agent-native/core/client/hooks";
export const CREATIVE_CONTEXT_ACTIONS = {
    listContexts: "list-creative-contexts",
    manageContext: "manage-creative-context",
    listMemberships: "list-context-memberships",
    manageMembership: "manage-context-membership",
    listSources: "list-context-sources",
    manageSource: "manage-context-source",
    previewImport: "preview-context-import",
    startImport: "start-context-import",
    importStatus: "get-context-import-status",
    listConnections: "list-context-connections",
    recommendRoots: "recommend-context-roots",
    search: "search-creative-context",
    getBrandProfile: "get-brand-profile",
    publishBrandDna: "publish-brand-dna",
    listPacks: "list-context-packs",
    managePack: "manage-context-pack",
    recordFeedback: "record-context-feedback",
    getPack: "get-context-pack",
    googlePickerSession: "get-google-picker-session",
    reviewItems: "review-context-items",
    listLogoCandidates: "list-canonical-logo-candidates",
    proposeLogo: "propose-canonical-logo",
    confirmLogo: "confirm-canonical-logo",
    listSuggestions: "list-context-suggestions",
    manageLayoutTemplate: "manage-layout-template",
};
function record(value) {
    return value && typeof value === "object"
        ? value
        : null;
}
function previewString(value, limit) {
    return typeof value === "string" ? value.slice(0, limit) : "";
}
function previewNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
/**
 * Accept only the compact structured preview contract. Native payloads and
 * arbitrary item metadata deliberately never cross into the shared client.
 */
export function parseCreativeContextSafePreview(value) {
    const preview = record(value);
    if (!preview || typeof preview.type !== "string")
        return null;
    if (preview.type === "slides") {
        const slides = Array.isArray(preview.slides)
            ? preview.slides.slice(0, 24).flatMap((entry, index) => {
                const slide = record(entry);
                if (!slide)
                    return [];
                return [
                    {
                        index: typeof slide.index === "number" && slide.index > 0
                            ? Math.floor(slide.index)
                            : index + 1,
                        title: previewString(slide.title, 160) || `Slide ${index + 1}`,
                        excerpt: previewString(slide.excerpt, 320),
                    },
                ];
            })
            : [];
        return {
            type: "slides",
            slideCount: typeof preview.slideCount === "number" && preview.slideCount >= 0
                ? Math.floor(preview.slideCount)
                : slides.length,
            slides,
        };
    }
    if (preview.type === "slide") {
        return {
            type: "slide",
            index: typeof preview.index === "number" && preview.index > 0
                ? Math.floor(preview.index)
                : 1,
            title: previewString(preview.title, 160) || "Slide",
            excerpt: previewString(preview.excerpt, 500),
        };
    }
    if (preview.type === "design") {
        const frames = Array.isArray(preview.frames)
            ? preview.frames.slice(0, 24).flatMap((entry) => {
                const frame = record(entry);
                if (!frame)
                    return [];
                return [
                    {
                        title: previewString(frame.title, 160) || "Untitled frame",
                        fileType: previewString(frame.fileType, 80) || "design",
                        excerpt: previewString(frame.excerpt, 320),
                    },
                ];
            })
            : [];
        return {
            type: "design",
            fileCount: typeof preview.fileCount === "number" && preview.fileCount >= 0
                ? Math.floor(preview.fileCount)
                : frames.length,
            frames,
        };
    }
    if (preview.type === "design-frame") {
        return {
            type: "design-frame",
            title: previewString(preview.title, 160) || "Untitled frame",
            fileType: previewString(preview.fileType, 80) || "design",
            excerpt: previewString(preview.excerpt, 500),
        };
    }
    if (preview.type === "document" || preview.type === "markdown") {
        const headings = Array.isArray(preview.headings)
            ? preview.headings
                .slice(0, 8)
                .map((heading) => previewString(heading, 160))
                .filter(Boolean)
            : [];
        const blocks = Array.isArray(preview.blocks)
            ? preview.blocks.slice(0, 40).flatMap((entry) => {
                const block = record(entry);
                if (!block)
                    return [];
                const kind = block.kind === "heading" ||
                    block.kind === "bullet" ||
                    block.kind === "quote" ||
                    block.kind === "code"
                    ? block.kind
                    : "paragraph";
                const text = previewString(block.text, 600);
                if (!text)
                    return [];
                const level = kind === "heading" &&
                    typeof block.level === "number" &&
                    block.level >= 1 &&
                    block.level <= 6
                    ? Math.floor(block.level)
                    : undefined;
                return [{ kind, text, ...(level ? { level } : {}) }];
            })
            : [];
        return {
            type: "document",
            headings,
            excerpt: previewString(preview.excerpt, 1_500),
            blocks,
        };
    }
    if (preview.type === "asset") {
        return {
            type: "asset",
            mediaType: preview.mediaType === "video" ? "video" : "image",
            width: previewNumber(preview.width),
            height: previewNumber(preview.height),
            durationSeconds: previewNumber(preview.durationSeconds),
        };
    }
    if (preview.type === "dashboard") {
        const panels = Array.isArray(preview.panels)
            ? preview.panels.slice(0, 24).flatMap((entry, index) => {
                const panel = record(entry);
                if (!panel)
                    return [];
                return [
                    {
                        id: previewString(panel.id, 120) || String(index + 1),
                        title: previewString(panel.title, 160) || `Panel ${index + 1}`,
                        visualization: previewString(panel.visualization, 80) || "chart",
                    },
                ];
            })
            : [];
        return { type: "dashboard", data: "synthetic", panels };
    }
    return null;
}
function contextSummary(value) {
    const source = record(value);
    if (!source ||
        typeof source.id !== "string" ||
        typeof source.name !== "string") {
        return null;
    }
    const access = record(source.access);
    const role = access?.role === "owner" ||
        access?.role === "admin" ||
        access?.role === "editor"
        ? access.role
        : "viewer";
    return {
        id: source.id,
        name: source.name,
        description: typeof source.description === "string" ? source.description : null,
        kind: source.kind === "specialty" ? "specialty" : "default",
        memberCount: typeof source.memberCount === "number" ? source.memberCount : 0,
        updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
        approvalPolicy: source.approvalPolicy === "review" ||
            source.approvalPolicy === "admins-only"
            ? source.approvalPolicy
            : "open",
        visibility: source.visibility === "org" || source.visibility === "public"
            ? source.visibility
            : "private",
        access: {
            role,
            canSubmit: access?.canSubmit === true,
            canReview: access?.canReview === true,
            canAdmin: access?.canAdmin === true,
        },
    };
}
export function parseCreativeContexts(value) {
    const source = Array.isArray(value)
        ? value
        : (record(value)?.contexts ?? record(value)?.items ?? []);
    return Array.isArray(source)
        ? source
            .map(contextSummary)
            .filter((item) => Boolean(item))
        : [];
}
function parseContextPreviewItem(value) {
    const item = record(value);
    if (!item ||
        typeof item.id !== "string" ||
        typeof item.itemVersionId !== "string" ||
        typeof item.title !== "string" ||
        typeof item.kind !== "string")
        return null;
    const media = Array.isArray(item.media)
        ? item.media.flatMap((value) => {
            const medium = record(value);
            return medium &&
                typeof medium.id === "string" &&
                typeof medium.kind === "string" &&
                typeof medium.url === "string"
                ? [
                    {
                        id: medium.id,
                        kind: medium.kind,
                        mimeType: typeof medium.mimeType === "string" ? medium.mimeType : null,
                        url: medium.url,
                    },
                ]
                : [];
        })
        : [];
    return {
        id: item.id,
        itemVersionId: item.itemVersionId,
        title: item.title,
        kind: item.kind,
        status: typeof item.status === "string" ? item.status : "active",
        sourceModifiedAt: typeof item.sourceModifiedAt === "string" ? item.sourceModifiedAt : null,
        preview: parseCreativeContextSafePreview(item.preview),
        media,
    };
}
export function parseContextMemberships(value) {
    const source = Array.isArray(value)
        ? value
        : (record(value)?.memberships ?? record(value)?.items ?? []);
    if (!Array.isArray(source))
        return [];
    return source.flatMap((value) => {
        const item = record(value);
        if (!item ||
            typeof item.id !== "string" ||
            typeof item.contextId !== "string") {
            return [];
        }
        return [
            {
                id: item.id,
                contextId: item.contextId,
                publishedItemId: typeof item.publishedItemId === "string"
                    ? item.publishedItemId
                    : null,
                publishedItemVersionId: typeof item.publishedItemVersionId === "string"
                    ? item.publishedItemVersionId
                    : null,
                pendingSubmissionId: typeof item.pendingSubmissionId === "string"
                    ? item.pendingSubmissionId
                    : null,
                rank: item.rank === "canonical" || item.rank === "exemplar"
                    ? item.rank
                    : "normal",
                purpose: typeof item.purpose === "string" ? item.purpose : null,
                status: item.status === "removed" ? "removed" : "active",
                updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
                nativeUpdateStatus: (() => {
                    const status = record(item.nativeUpdateStatus)?.state;
                    return status === "current" ||
                        status === "update-available" ||
                        status === "unknown"
                        ? { state: status }
                        : null;
                })(),
                pendingSubmission: (() => {
                    const submission = record(item.pendingSubmission);
                    return submission &&
                        typeof submission.id === "string" &&
                        typeof submission.status === "string"
                        ? {
                            id: submission.id,
                            status: submission.status,
                            note: typeof submission.note === "string" ? submission.note : null,
                            submittedBy: typeof submission.submittedBy === "string"
                                ? submission.submittedBy
                                : "",
                            proposedItem: parseContextPreviewItem(submission.proposedItem),
                        }
                        : null;
                })(),
                publishedItem: parseContextPreviewItem(item.publishedItem),
            },
        ];
    });
}
export function parseContextMembershipsForResource(value, resource) {
    const source = record(value)?.memberships;
    if (!Array.isArray(source))
        return [];
    const artifactKey = `${resource.appId}:${resource.resourceType}:${resource.resourceId}`;
    return parseContextMemberships({
        memberships: source.filter((value) => record(value)?.artifactKey === artifactKey),
    });
}
export function useCreativeContextSources(params = {}) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listSources, params);
}
export function useCreativeContexts(params = {}) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listContexts, { limit: 50, ...params });
}
export function useManageCreativeContext() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.manageContext);
}
export function useContextMemberships(params) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listMemberships, params ? { limit: 50, ...params } : undefined, { enabled: Boolean(params) });
}
export function useManageContextMembership() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.manageMembership);
}
export function useCreativeContextSearch() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.search);
}
export function useCreativeContextPacks() {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listPacks, { limit: 50 });
}
export function useRefreshCreativeContextSource() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.startImport);
}
export function useManageCreativeContextSource() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.manageSource);
}
export function usePreviewCreativeContextImport(sourceId) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.previewImport, sourceId ? { sourceId, limit: 100 } : undefined, { enabled: Boolean(sourceId) });
}
export function useStartCreativeContextImport() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.startImport);
}
export function useCreativeContextImportStatus(jobId) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.importStatus, jobId ? { jobId } : undefined, {
        enabled: Boolean(jobId),
        refetchInterval: (query) => {
            const status = query.state.data?.job?.status;
            return status === "queued" || status === "running" ? 2_000 : false;
        },
    });
}
export function useCreativeContextConnections(provider) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listConnections, provider ? { provider } : undefined, { enabled: Boolean(provider) });
}
export function useCreativeContextRootRecommendations(provider, connectionId, figmaBoundary = {}) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.recommendRoots, provider && connectionId
        ? { provider, connectionId, limit: 15, ...figmaBoundary }
        : undefined, { enabled: Boolean(provider && connectionId) });
}
export function useCreativeContextGooglePickerSession(connectionId) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.googlePickerSession, connectionId ? { connectionId } : undefined, { enabled: false });
}
export function useCreativeContextBrandProfile() {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.getBrandProfile, {});
}
export function usePublishCreativeContextBrandDna() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.publishBrandDna);
}
export function useCreativeContextPack(packId) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.getPack, packId ? { packId } : undefined, { enabled: Boolean(packId) });
}
export function useReviewCreativeContextItems() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.reviewItems);
}
export function useCanonicalLogoCandidates(profileId, enabled = true) {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listLogoCandidates, { profileId, limit: 6 }, { enabled });
}
export function useCreativeContextSuggestions() {
    return useActionQuery(CREATIVE_CONTEXT_ACTIONS.listSuggestions, { limit: 50 });
}
export function useProposeCanonicalLogo() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.proposeLogo);
}
export function useConfirmCanonicalLogo() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.confirmLogo);
}
export function useManageLayoutTemplate() {
    return useActionMutation(CREATIVE_CONTEXT_ACTIONS.manageLayoutTemplate);
}
//# sourceMappingURL=actions.js.map