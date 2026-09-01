declare const _default: import("@agent-native/core/action").ActionDefinition<{
    operation: "create";
    name: string;
    kind: "figma" | "google-slides" | "manual" | "notion" | "upload" | "website";
    externalRef?: string | undefined;
    connectionId?: string | undefined;
    config?: Record<string, unknown> | undefined;
    upstreamAccess?: "available" | "restricted" | "unknown" | undefined;
} | {
    operation: "update";
    sourceId: string;
    patch: {
        name?: string | undefined;
        externalRef?: string | null | undefined;
        connectionId?: string | null | undefined;
        config?: Record<string, unknown> | undefined;
        status?: "active" | "archived" | "error" | "paused" | undefined;
        upstreamAccess?: "available" | "restricted" | "unknown" | undefined;
    };
} | {
    operation: "archive" | "delete" | "restore";
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
}, {
    source: import("../types.js").ContextSourceSummary;
    deleted: boolean;
    promotionPreview?: undefined;
    purgeJobId?: undefined;
} | {
    source: null;
    deleted: boolean;
    promotionPreview: import("../types.js").ContextSourcePromotionPreview;
    purgeJobId?: undefined;
} | {
    promotionPreview?: undefined;
    source: import("../types.js").ContextSourceSummary;
    deleted: boolean;
    purgeJobId: string;
}>;
export default _default;
//# sourceMappingURL=manage-context-source.d.ts.map