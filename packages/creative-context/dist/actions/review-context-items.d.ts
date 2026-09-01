declare const _default: import("@agent-native/core/action").ActionDefinition<{
    sourceId: string;
    operation: "list";
    queue?: "all" | "restricted" | undefined;
    limit?: unknown;
} | {
    sourceId: string;
    operation: "approve" | "deprecate" | "exclude" | "exemplar" | "ignore" | "normal" | "restore" | "star" | "unstar";
    itemIds: string[];
}, {
    updated: number;
    items: {
        id: string;
        currentVersionId: string;
        sourceId: string;
        externalId: string;
        kind: string;
        title: string;
        canonicalUrl: string | null;
        upstreamAccess: import("../types.js").UpstreamAccess;
        curationStatus: import("../types.js").ContextCurationStatus;
        curationRank: import("../types.js").ContextCurationRank;
        starred: boolean;
        status: import("../types.js").ContextItemStatus;
        inventoryState: "discovered" | "available" | "removed" | "error";
        tags: string[];
        colors: string[];
        parentItemId: string | null;
        updatedAt: string;
        hasThumbnail: boolean;
        provenance: unknown;
    }[];
}>;
export default _default;
//# sourceMappingURL=review-context-items.d.ts.map