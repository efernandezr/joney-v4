declare const _default: import("@agent-native/core/action").ActionDefinition<{
    sourceId: string;
    limit?: unknown;
    cursor?: string | undefined;
}, {
    sourceId: string;
    items: {
        externalId: string;
        kind: string;
        title: string;
        canonicalUrl: string | undefined;
        mimeType: string | undefined;
        sourceModifiedAt: string | undefined;
        sizeBytes: number | undefined;
        metadata: unknown;
        upstreamAccess: import("../types.js").UpstreamAccess | undefined;
    }[];
    smartDefaultExternalIds: string[];
    nextCursor: string | undefined;
    total: number | undefined;
}>;
export default _default;
//# sourceMappingURL=preview-context-import.d.ts.map