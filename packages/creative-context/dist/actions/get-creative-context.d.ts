import { UNTRUSTED_REFERENCE_ROLE } from "../untrusted-reference.js";
declare const _default: import("@agent-native/core/action").ActionDefinition<{
    itemId: string;
    itemVersionId?: string | undefined;
}, {
    pendingJobId: string | null;
    dataRole: "untrusted-reference";
    item: {
        id: string;
        sourceId: string;
        kind: string;
        mimeType: string | null;
        currentVersionId: string;
        status: import("../types.js").ContextItemStatus;
        upstreamAccess: import("../types.js").UpstreamAccess;
        curationStatus: import("../types.js").ContextCurationStatus;
        curationRank: import("../types.js").ContextCurationRank;
        starred: boolean;
        inventoryState: "discovered" | "available" | "removed" | "error";
        indexState: "pending" | "indexed" | "stale" | "error";
        tags: string[];
        colors: string[];
        sortOrder: number;
        parentItemId: string | null;
        createdAt: string;
        updatedAt: string;
        canonicalUrl: string | null;
        hasThumbnail: boolean;
        dataRole: "untrusted-reference";
        externalId: string;
        title: string;
        provenance: {
            dataRole: typeof UNTRUSTED_REFERENCE_ROLE;
            content: string;
        };
    };
    version: {
        id: string;
        itemId: string;
        versionNumber: number;
        contentHash: string;
        mimeType: string | null;
        sourceModifiedAt: string | null;
        parseStatus: "pending" | "parsed" | "failed";
        createdAt: string;
        hasRawSnapshot: boolean;
        dataRole: "untrusted-reference";
        title: string;
        content: string;
        nativeCode: {
            dataRole: "untrusted-reference";
            format: "design-html" | "slides-html";
            content: string;
            retrieval?: {
                mode: string;
                root: {
                    itemId: string;
                    itemVersionId: string;
                };
                cloneAction: string;
                parts: {
                    externalId: string;
                    itemId: string | null;
                    itemVersionId: string | null;
                }[];
            } | undefined;
            oversized?: undefined;
            byteLength?: undefined;
            maxInlineBytes?: undefined;
            instruction?: undefined;
        } | {
            dataRole: "untrusted-reference";
            format: "design-html" | "slides-html";
            content: null;
            oversized: boolean;
            byteLength: number;
            maxInlineBytes: number;
            retrieval: {
                mode: string;
                root: {
                    itemId: string;
                    itemVersionId: string;
                };
                cloneAction: string;
                parts: {
                    externalId: string;
                    itemId: string | null;
                    itemVersionId: string | null;
                }[];
            };
            instruction: string;
        } | null;
        summary: string | null;
        sourceVersion: string | null;
        parseError: string | null;
        metadata: {
            dataRole: typeof UNTRUSTED_REFERENCE_ROLE;
            content: string;
        };
    };
    chunks: {
        id: string;
        itemId: string;
        itemVersionId: string;
        ordinal: number;
        kind: string;
        startOffset: number | null;
        endOffset: number | null;
        tokenCount: number | null;
        dataRole: "untrusted-reference";
        text: string;
        metadata: {
            dataRole: typeof UNTRUSTED_REFERENCE_ROLE;
            content: string;
        };
    }[];
    media: {
        id: string;
        itemId: string;
        itemVersionId: string;
        kind: import("../types.js").ContextMediaInput["kind"];
        mimeType: string | null;
        accessMode: "public" | "private" | "expiring";
        captionStatus: "pending" | "complete" | "failed" | "not-needed";
        palette: string[];
        contentHash: string | null;
        width: number | null;
        height: number | null;
        durationMs: number | null;
        url: string;
        hasOriginal: boolean;
        dataRole: "untrusted-reference";
        altText: string | null;
        caption: string | null;
        ocrText: string | null;
        metadata: {
            dataRole: typeof UNTRUSTED_REFERENCE_ROLE;
            content: string;
        };
    }[];
    edges: {
        id: string;
        fromItemId: string;
        fromItemVersionId: string;
        toItemId: string | null;
        toItemVersionId: string | null;
        relation: string;
        dataRole: "untrusted-reference";
        toExternalId: string | null;
        metadata: {
            dataRole: typeof UNTRUSTED_REFERENCE_ROLE;
            content: string;
        };
    }[];
}>;
export default _default;
//# sourceMappingURL=get-creative-context.d.ts.map