import { type NativeCreativeResourceRef } from "../server/native-resource-capture.js";
import type { CreativeContextApprovalPolicy, CreativeContextMembership, CreativeContextSubmissionSummary, CreativeContextSummary } from "../types.js";
type Rank = "canonical" | "exemplar" | "normal";
export declare function createCreativeContext(input: {
    name: string;
    description?: string | null;
    kind: "default" | "specialty";
    brandProfileId?: string | null;
    approvalPolicy?: CreativeContextApprovalPolicy;
}): Promise<CreativeContextSummary | null>;
/** Idempotently establishes the actor's governed Default with the currently usable corpus. */
export declare function ensureDefaultCreativeContext(): Promise<CreativeContextSummary | null>;
export declare function getCreativeContextById(contextId: string): Promise<CreativeContextSummary | null>;
export declare function getCreativeContextAppBinding(appId: string): Promise<CreativeContextSummary | null>;
export declare function listCreativeContexts(input: {
    limit: number;
    cursor?: string;
    includeArchived?: boolean;
}): Promise<{
    contexts: CreativeContextSummary[];
    nextCursor: any;
}>;
export declare function updateCreativeContext(contextId: string, patch: {
    name?: string;
    description?: string | null;
    brandProfileId?: string | null;
    approvalPolicy?: CreativeContextApprovalPolicy;
}): Promise<CreativeContextSummary | null>;
export declare function archiveCreativeContext(contextId: string): Promise<CreativeContextSummary | null>;
export declare function setCreativeContextAppDefault(contextId: string, appId: string): Promise<CreativeContextSummary | null>;
export declare function listContextMemberships(input: {
    contextId: string;
    status?: "active" | "removed";
    limit: number;
    cursor?: string;
}): Promise<{
    memberships: {
        id: string;
        contextId: string;
        artifactKey: string;
        publishedItemId: string | null;
        publishedItemVersionId: string | null;
        pendingSubmissionId: string | null;
        rank: Exclude<import("../types.js").ContextCurationRank, "ignored">;
        purpose: string | null;
        status: import("../types.js").CreativeContextMembershipStatus;
        createdAt: string;
        updatedAt: string;
        nativeUpdateStatus?: {
            state: "current" | "update-available" | "unknown";
        };
        publishedItem: {
            id: any;
            itemVersionId: any;
            title: any;
            kind: any;
            canonicalUrl: string | null;
            status: any;
            sourceModifiedAt: any;
            media: {
                id: string;
                kind: any;
                mimeType: string | null;
                url: string;
            }[];
            preview?: Record<string, unknown> | undefined;
        } | null;
        pendingSubmission: {
            id: string;
            contextId: string;
            membershipId: string;
            artifactKey: string;
            publishedItemId: string | null;
            publishedItemVersionId: string | null;
            note: string | null;
            status: import("../types.js").CreativeContextSubmissionStatus;
            submittedBy: string;
            reviewedBy: string | null;
            reviewNote: string | null;
            createdAt: string;
            reviewedAt: string | null;
            proposedItem: {
                id: any;
                itemVersionId: any;
                title: any;
                kind: any;
                canonicalUrl: string | null;
                status: any;
                sourceModifiedAt: any;
                media: {
                    id: string;
                    kind: any;
                    mimeType: string | null;
                    url: string;
                }[];
                preview?: Record<string, unknown> | undefined;
            } | null;
        } | null;
    }[];
    nextCursor: any;
}>;
/**
 * Resolves private media for a pending submission without making the staged
 * item generally readable. This is intentionally server-only: callers must
 * already have an authenticated request context and can only read the exact
 * staged version they submitted or are allowed to review.
 */
export declare function readPendingCreativeContextMedia(input: {
    mediaId?: string;
    itemId?: string;
    itemVersionId?: string;
}): Promise<{
    itemId: string;
    itemVersionId: string;
    mediaId: string | null;
    storageKey: string | null;
    mimeType: string | null;
} | null>;
export declare function submitLatestContextMembershipUpdate(input: {
    contextId: string;
    membershipId: string;
    note?: string;
    confirmBroaderPublication?: boolean;
}): Promise<{
    membershipId: any;
    submission: CreativeContextSubmissionSummary;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership: CreativeContextMembership;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn: boolean;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges: boolean;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved: boolean;
}>;
export declare function manageContextMembership(input: {
    operation: "submit" | "approve" | "request-changes" | "withdraw" | "remove";
    contextId: string;
    membershipId?: string;
    itemId?: string;
    itemVersionId?: string;
    nativeResource?: NativeCreativeResourceRef;
    note?: string;
    rank?: Rank;
    purpose?: string;
    confirmBroaderPublication?: boolean;
}): Promise<{
    membershipId: any;
    submission: CreativeContextSubmissionSummary;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership: CreativeContextMembership;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn: boolean;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges: boolean;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved: boolean;
}>;
export declare function resolveNativeContextCloneReference(input: NativeCreativeResourceRef & {
    contextId: string;
    artifactKey: string;
}): Promise<{
    publishedItemId: any;
    publishedItemVersionId: any;
    cloneHandle: {};
}>;
export {};
//# sourceMappingURL=contexts.d.ts.map