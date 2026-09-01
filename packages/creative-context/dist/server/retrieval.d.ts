import { type SearchMatchMode } from "@agent-native/core/search-utils";
import type { ContextItemStatus } from "../types.js";
export interface CreativeContextSearchInput {
    query?: string;
    imageBlobRef?: string;
    mediaId?: string;
    sourceIds?: string[];
    packId?: string;
    contextId?: string;
    kinds?: string[];
    tags?: string[];
    colors?: string[];
    updatedAfter?: string;
    updatedBefore?: string;
    statuses?: ContextItemStatus[];
    matchMode?: SearchMatchMode;
    limit: number;
    cursor?: string;
    maxPerSource?: number;
    snapshot?: boolean;
    contextPackName?: string;
}
export declare function performCreativeContextSearch(input: CreativeContextSearchInput): Promise<{
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
export declare function ensureContextItemHydration(itemId: string): Promise<string | null>;
//# sourceMappingURL=retrieval.d.ts.map