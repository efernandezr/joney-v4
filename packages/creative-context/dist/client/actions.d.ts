import type { BrandDnaVersion, BrandProfile, ContextImportMode, ContextJob, ContextPackDetail, ContextPackSummary, ContextReviewItem, ContextSearchResult, ContextSourceStatus, ContextSourceSummary, CreativeContextSuggestion, ImportPreviewItem, UpstreamAccess } from "../types.js";
export declare const CREATIVE_CONTEXT_ACTIONS: {
    readonly listContexts: "list-creative-contexts";
    readonly manageContext: "manage-creative-context";
    readonly listMemberships: "list-context-memberships";
    readonly manageMembership: "manage-context-membership";
    readonly listSources: "list-context-sources";
    readonly manageSource: "manage-context-source";
    readonly previewImport: "preview-context-import";
    readonly startImport: "start-context-import";
    readonly importStatus: "get-context-import-status";
    readonly listConnections: "list-context-connections";
    readonly recommendRoots: "recommend-context-roots";
    readonly search: "search-creative-context";
    readonly getBrandProfile: "get-brand-profile";
    readonly publishBrandDna: "publish-brand-dna";
    readonly listPacks: "list-context-packs";
    readonly managePack: "manage-context-pack";
    readonly recordFeedback: "record-context-feedback";
    readonly getPack: "get-context-pack";
    readonly googlePickerSession: "get-google-picker-session";
    readonly reviewItems: "review-context-items";
    readonly listLogoCandidates: "list-canonical-logo-candidates";
    readonly proposeLogo: "propose-canonical-logo";
    readonly confirmLogo: "confirm-canonical-logo";
    readonly listSuggestions: "list-context-suggestions";
    readonly manageLayoutTemplate: "manage-layout-template";
};
export type CreativeContextPolicy = "open" | "review" | "admins-only";
export type CreativeContextMembershipRank = "canonical" | "exemplar" | "normal";
export type CreativeContextSafePreview = {
    type: "slides";
    slideCount: number;
    slides: Array<{
        index: number;
        title: string;
        excerpt: string;
    }>;
} | {
    type: "slide";
    index: number;
    title: string;
    excerpt: string;
} | {
    type: "design";
    fileCount: number;
    frames: Array<{
        title: string;
        fileType: string;
        excerpt: string;
    }>;
} | {
    type: "design-frame";
    title: string;
    fileType: string;
    excerpt: string;
} | {
    type: "document";
    headings: string[];
    excerpt: string;
    blocks: Array<{
        kind: "heading" | "paragraph" | "bullet" | "quote" | "code";
        text: string;
        level?: number;
    }>;
} | {
    type: "asset";
    mediaType: "image" | "video";
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
} | {
    type: "dashboard";
    data: "synthetic";
    panels: Array<{
        id: string;
        title: string;
        visualization: string;
    }>;
};
export interface CreativeContextSummary {
    id: string;
    name: string;
    description?: string | null;
    kind: "default" | "specialty";
    memberCount: number;
    updatedAt?: string | null;
    approvalPolicy: CreativeContextPolicy;
    visibility: "private" | "org" | "public";
    access: {
        role: "viewer" | "editor" | "admin" | "owner";
        canSubmit: boolean;
        canReview: boolean;
        canAdmin: boolean;
    };
}
export interface CreativeContextPreviewItem {
    id: string;
    itemVersionId: string;
    title: string;
    kind: string;
    status: string;
    sourceModifiedAt: string | null;
    preview: CreativeContextSafePreview | null;
    media: Array<{
        id: string;
        kind: string;
        mimeType: string | null;
        url: string;
    }>;
}
export interface CreativeContextMembership {
    id: string;
    contextId: string;
    publishedItemId: string | null;
    publishedItemVersionId: string | null;
    pendingSubmissionId: string | null;
    rank: CreativeContextMembershipRank;
    purpose: string | null;
    status: "active" | "removed";
    updatedAt?: string | null;
    nativeUpdateStatus?: {
        state: "current" | "update-available" | "unknown";
    } | null;
    publishedItem?: CreativeContextPreviewItem | null;
    pendingSubmission?: {
        id: string;
        status: string;
        note: string | null;
        submittedBy: string;
        proposedItem: CreativeContextPreviewItem | null;
    } | null;
}
export interface ListCreativeContextsParams {
    limit?: number;
    cursor?: string;
    includeArchived?: boolean;
}
export interface ListCreativeContextsResult {
    contexts: CreativeContextSummary[];
    appId?: string;
    appDefaultContextId?: string | null;
}
export type ManageCreativeContextParams = {
    operation: "create";
    name: string;
    description?: string | null;
    kind: "default" | "specialty";
    brandProfileId?: string | null;
    approvalPolicy?: CreativeContextPolicy;
} | {
    operation: "update";
    contextId: string;
    patch: {
        name?: string;
        description?: string | null;
        brandProfileId?: string | null;
        approvalPolicy?: CreativeContextPolicy;
    };
} | {
    operation: "archive";
    contextId: string;
} | {
    operation: "set-app-default";
    contextId: string;
    appId: string;
};
export interface ManageCreativeContextResult {
    context: CreativeContextSummary | null;
}
export interface ListContextMembershipsParams {
    contextId: string;
    status?: "active" | "removed";
    limit?: number;
    cursor?: string;
}
export interface ListContextMembershipsResult {
    memberships: CreativeContextMembership[];
}
export type ManageContextMembershipParams = {
    operation: "submit";
    contextId: string;
    itemId?: string;
    itemVersionId?: string;
    nativeResource?: {
        appId: string;
        resourceType: string;
        resourceId: string;
        expectedUpdatedAt?: string;
    };
    rank?: CreativeContextMembershipRank;
    purpose?: string;
    note?: string;
    confirmBroaderPublication?: true;
} | {
    operation: "submit-latest";
    contextId: string;
    membershipId: string;
    note?: string;
    confirmBroaderPublication?: true;
} | {
    operation: "approve" | "request-changes" | "withdraw" | "remove";
    contextId: string;
    membershipId: string;
    note?: string | null;
};
export interface ManageContextMembershipResult {
    membership: CreativeContextMembership | null;
    membershipId?: string;
    submission?: {
        id: string;
        status: string;
    };
    withdrawn?: boolean;
    approved?: boolean;
    requestChanges?: boolean;
}
/**
 * Accept only the compact structured preview contract. Native payloads and
 * arbitrary item metadata deliberately never cross into the shared client.
 */
export declare function parseCreativeContextSafePreview(value: unknown): CreativeContextSafePreview | null;
export declare function parseCreativeContexts(value: unknown): CreativeContextSummary[];
export declare function parseContextMemberships(value: unknown): CreativeContextMembership[];
export declare function parseContextMembershipsForResource(value: unknown, resource: {
    appId: string;
    resourceType: string;
    resourceId: string;
}): CreativeContextMembership[];
export interface CanonicalLogoCandidate {
    mediaId: string;
    itemId: string;
    itemVersionId: string;
    title: string;
    mimeType: string | null;
    thumbnailUrl: string;
    score: number;
}
export interface ListCanonicalLogoCandidatesResult {
    profileId: string | null;
    candidates: CanonicalLogoCandidate[];
}
export interface ListCreativeContextSuggestionsResult {
    suggestions: CreativeContextSuggestion[];
    capabilities: {
        canonicalLogo: boolean;
        layoutTemplate: boolean;
    };
}
export interface ListContextSourcesParams {
    status?: ContextSourceStatus;
    kind?: string;
    limit?: number;
    cursor?: string;
}
export interface ListContextSourcesResult {
    sources: ContextSourceSummary[];
    nextCursor?: string;
}
export interface SearchCreativeContextParams {
    query: string;
    sourceIds?: string[];
    packId?: string;
    contextId?: string;
    kinds?: string[];
    limit?: number;
    cursor?: string;
    snapshot?: boolean;
    contextPackName?: string;
}
export interface SearchCreativeContextResult {
    query: string;
    results: ContextSearchResult[];
    nextCursor?: string;
    coverage: {
        mode: "none" | "lexical" | "fts" | "vector" | "fused";
        lanes: {
            lexical: {
                available: boolean;
                count: number;
            };
            fts: {
                available: boolean;
                count: number;
            };
            vector: {
                available: boolean;
                count: number;
            };
        };
    };
    contextPackId: string | null;
}
export interface ListContextPacksResult {
    packs: ContextPackSummary[];
    nextCursor?: string;
}
export interface StartContextImportParams {
    sourceId: string;
    mode?: ContextImportMode;
    itemExternalIds?: string[];
}
export interface StartContextImportResult {
    job: ContextJob;
}
export type ManageContextSourceParams = {
    operation: "create";
    name: string;
    kind: string;
    externalRef?: string;
    connectionId?: string;
    config?: Record<string, unknown>;
    upstreamAccess?: UpstreamAccess;
} | {
    operation: "update";
    sourceId: string;
    patch: {
        name?: string;
        externalRef?: string | null;
        connectionId?: string | null;
        config?: Record<string, unknown>;
        status?: ContextSourceStatus;
        upstreamAccess?: UpstreamAccess;
    };
} | {
    operation: "archive" | "restore" | "delete";
    sourceId: string;
} | {
    operation: "preview-promotion";
    sourceId: string;
} | {
    operation: "promote";
    sourceId: string;
    confirmation: {
        containerRef: string;
        boundaryHash: string;
        itemCount: number;
    };
};
export interface ManageContextSourceResult {
    source: ContextSourceSummary | null;
    deleted: boolean;
    purgeJobId?: string;
    promotionPreview?: {
        sourceId: string;
        containerRef: string;
        boundaryHash: string;
        itemCount: number;
        restrictedItemCount: number;
        targetOrgId: string;
        callerAuthority: "org-admin" | "verified-container-owner";
    };
}
export interface PreviewContextImportResult {
    sourceId: string;
    items: ImportPreviewItem[];
    smartDefaultExternalIds: string[];
    nextCursor?: string;
    total?: number;
}
export interface GetContextImportStatusResult {
    job: ContextJob | null;
}
export type CreativeContextConnectionProvider = "google_drive" | "figma" | "notion";
export interface CreativeContextConnection {
    connectionId: string;
    provider: CreativeContextConnectionProvider;
    label: string;
}
export interface ListCreativeContextConnectionsResult {
    appId: string;
    provider: CreativeContextConnectionProvider;
    connections: CreativeContextConnection[];
    autoSelectedConnectionId: string | null;
    needsPicker: boolean;
    needsSetup: boolean;
    connectionsPath: string;
    connectPath: string;
}
export interface GetGooglePickerSessionResult {
    accessToken: string;
    accountLabel: string | null;
    apiKey: string;
    appId: string;
}
export type CreativeContextRecommendationProvider = "google-slides" | "figma" | "notion";
export interface CreativeContextRootRecommendation {
    externalId: string;
    provider: CreativeContextRecommendationProvider;
    kind: "page" | "presentation" | "file";
    title: string;
    canonicalUrl?: string;
    sourceModifiedAt?: string;
    containerRef?: string;
}
export interface RecommendCreativeContextRootsResult {
    recommendations: CreativeContextRootRecommendation[];
    persisted: false;
    requiresExplicitBoundary: true;
    unavailableReason?: string;
}
export interface GetBrandProfileResult {
    profile: BrandProfile | null;
    dna: BrandDnaVersion | null;
}
export interface PublishBrandDnaParams {
    profileId: string;
    proposalVersionId: string;
    confirmation: {
        proposalVersionId: string;
        contentHash: string;
    };
}
export interface PublishBrandDnaResult {
    profile: BrandProfile;
    dna: BrandDnaVersion;
}
export interface GetContextPackResult {
    pack: ContextPackDetail | null;
}
export type ReviewContextItemsParams = {
    sourceId: string;
    operation: "list";
    queue?: "restricted" | "all";
    limit?: number;
} | {
    sourceId: string;
    operation: "approve" | "exclude" | "exemplar" | "normal" | "ignore" | "star" | "unstar" | "deprecate" | "restore";
    itemIds: string[];
};
export interface ReviewContextItemsResult {
    items: ContextReviewItem[];
    updated: number;
}
export declare function useCreativeContextSources(params?: ListContextSourcesParams): import("@tanstack/react-query").UseQueryResult<NoInfer<ListContextSourcesResult>, Error>;
export declare function useCreativeContexts(params?: ListCreativeContextsParams): import("@tanstack/react-query").UseQueryResult<NoInfer<ListCreativeContextsResult>, Error>;
export declare function useManageCreativeContext(): import("@tanstack/react-query").UseMutationResult<ManageCreativeContextResult, Error, ManageCreativeContextParams, unknown>;
export declare function useContextMemberships(params: ListContextMembershipsParams | null): import("@tanstack/react-query").UseQueryResult<NoInfer<ListContextMembershipsResult>, Error>;
export declare function useManageContextMembership(): import("@tanstack/react-query").UseMutationResult<ManageContextMembershipResult, Error, ManageContextMembershipParams, unknown>;
export declare function useCreativeContextSearch(): import("@tanstack/react-query").UseMutationResult<SearchCreativeContextResult, Error, SearchCreativeContextParams, unknown>;
export declare function useCreativeContextPacks(): import("@tanstack/react-query").UseQueryResult<NoInfer<ListContextPacksResult>, Error>;
export declare function useRefreshCreativeContextSource(): import("@tanstack/react-query").UseMutationResult<StartContextImportResult, Error, StartContextImportParams, unknown>;
export declare function useManageCreativeContextSource(): import("@tanstack/react-query").UseMutationResult<ManageContextSourceResult, Error, ManageContextSourceParams, unknown>;
export declare function usePreviewCreativeContextImport(sourceId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<PreviewContextImportResult>, Error>;
export declare function useStartCreativeContextImport(): import("@tanstack/react-query").UseMutationResult<StartContextImportResult, Error, StartContextImportParams, unknown>;
export declare function useCreativeContextImportStatus(jobId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<GetContextImportStatusResult>, Error>;
export declare function useCreativeContextConnections(provider: CreativeContextConnectionProvider | null): import("@tanstack/react-query").UseQueryResult<NoInfer<ListCreativeContextConnectionsResult>, Error>;
export declare function useCreativeContextRootRecommendations(provider: CreativeContextRecommendationProvider | null, connectionId: string | null, figmaBoundary?: {
    figmaProjectId?: string;
    figmaTeamId?: string;
}): import("@tanstack/react-query").UseQueryResult<NoInfer<RecommendCreativeContextRootsResult>, Error>;
export declare function useCreativeContextGooglePickerSession(connectionId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<GetGooglePickerSessionResult>, Error>;
export declare function useCreativeContextBrandProfile(): import("@tanstack/react-query").UseQueryResult<NoInfer<GetBrandProfileResult>, Error>;
export declare function usePublishCreativeContextBrandDna(): import("@tanstack/react-query").UseMutationResult<PublishBrandDnaResult, Error, PublishBrandDnaParams, unknown>;
export declare function useCreativeContextPack(packId: string | null): import("@tanstack/react-query").UseQueryResult<NoInfer<GetContextPackResult>, Error>;
export declare function useReviewCreativeContextItems(): import("@tanstack/react-query").UseMutationResult<ReviewContextItemsResult, Error, ReviewContextItemsParams, unknown>;
export declare function useCanonicalLogoCandidates(profileId?: string, enabled?: boolean): import("@tanstack/react-query").UseQueryResult<NoInfer<ListCanonicalLogoCandidatesResult>, Error>;
export declare function useCreativeContextSuggestions(): import("@tanstack/react-query").UseQueryResult<NoInfer<ListCreativeContextSuggestionsResult>, Error>;
export declare function useProposeCanonicalLogo(): import("@tanstack/react-query").UseMutationResult<CreativeContextSuggestion, Error, {
    profileId?: string;
    itemId: string;
    itemVersionId?: string;
    reason?: string;
    payload?: Record<string, unknown>;
}, unknown>;
export declare function useConfirmCanonicalLogo(): import("@tanstack/react-query").UseMutationResult<CreativeContextSuggestion, Error, {
    suggestionId: string;
    decision: "confirm" | "reject";
}, unknown>;
export declare function useManageLayoutTemplate(): import("@tanstack/react-query").UseMutationResult<CreativeContextSuggestion, Error, {
    operation: "promote" | "demote" | "reject";
    suggestionId: string;
}, unknown>;
//# sourceMappingURL=actions.d.ts.map