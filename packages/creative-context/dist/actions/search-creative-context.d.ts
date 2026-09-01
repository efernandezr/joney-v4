declare const _default: import("@agent-native/core/action").ActionDefinition<{
    query?: string | undefined;
    imageBlobRef?: string | undefined;
    mediaId?: string | undefined;
    sourceIds?: string[] | undefined;
    packId?: string | undefined;
    contextId?: string | undefined;
    kinds?: string[] | undefined;
    tags?: string[] | undefined;
    colors?: string[] | undefined;
    updatedAfter?: string | undefined;
    updatedBefore?: string | undefined;
    statuses?: ("active" | "deprecated")[] | undefined;
    matchMode?: "allTerms" | "anyTerm" | "phrase" | "regex" | undefined;
    limit?: unknown;
    cursor?: string | undefined;
    maxPerSource?: unknown;
    snapshot?: boolean | undefined;
    contextPackName?: string | undefined;
}, {
    query: string | null;
    results: {
        itemId: string;
        itemVersionId: string;
        chunkId: string | null;
        sourceId: string;
        sourceName: string;
        kind: string;
        canonicalUrl: string | null;
        mimeType: string | null;
        nativeArtifact: {
            app: string;
            format: string;
        } | null;
        chunkOrdinal: number;
        tags: string[];
        colors: string[];
        updatedAt: string;
        curationRank: import("../types.js").ContextItemSummary["curationRank"];
        starred: boolean;
        externalId: string;
        indexState: import("../types.js").ContextItemSummary["indexState"];
        inventoryOnly: boolean;
        priorReuseCount: number;
        helpfulFeedbackCount: number;
        body: undefined;
        summary: undefined;
        dataRole: "untrusted-reference";
        title: string;
        excerpt: string;
        score: number;
        reasons: string[];
        laneRanks: Record<string, number>;
        laneScores: Record<string, number>;
        pendingJobId: string | null;
    }[];
    nextCursor: string | undefined;
    contextPackId: string | null;
    coverage: {
        mode: string;
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
        sourceCount: number;
        itemCount: number;
    };
}>;
export default _default;
//# sourceMappingURL=search-creative-context.d.ts.map