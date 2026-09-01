import { type SearchMatchMode } from "@agent-native/core/search-utils";
import type { ContextDetail, ContextEmbeddingMetadata, ContextFeedbackSignal, ContextIngestBatch, ContextIngestResult, ContextInventoryUpsertResult, ContextItemSummary, ContextReviewItem, ContextSearchResult, EmbeddingSet, ImportPreviewItem } from "../types.js";
export declare function assertImmutableContextVersion(operation: string): never;
export declare function ingestItems(batch: ContextIngestBatch): Promise<ContextIngestResult>;
export declare function upsertSourceInventory(input: {
    sourceId: string;
    items: ImportPreviewItem[];
    completedAt?: string;
}): Promise<ContextInventoryUpsertResult>;
export declare function reconcileSourceInventory(input: {
    sourceId: string;
    presentExternalIds: string[];
    completedAt?: string;
}): Promise<{
    removed: number;
    restored: number;
}>;
export interface AccessibleLexicalCandidatesInput {
    query: string;
    sourceIds?: string[];
    packId?: string;
    contextId?: string;
    kinds?: string[];
    tags?: string[];
    colors?: string[];
    updatedAfter?: string;
    updatedBefore?: string;
    statuses?: ContextItemSummary["status"][];
    matchMode?: SearchMatchMode;
    limit: number;
    cursor?: string;
}
export interface AccessibleSearchDocument extends ContextSearchResult {
    body: string;
    summary: string | null;
    chunkOrdinal: number;
    tags: string[];
    colors: string[];
    updatedAt: string;
    curationRank: ContextItemSummary["curationRank"];
    starred: boolean;
    externalId: string;
    indexState: ContextItemSummary["indexState"];
    inventoryOnly: boolean;
    priorReuseCount: number;
    helpfulFeedbackCount: number;
}
export declare function listAccessibleSearchDocuments(input: Omit<AccessibleLexicalCandidatesInput, "query" | "matchMode" | "cursor"> & {
    itemIds?: string[];
    chunkIds?: string[];
    afterChunkId?: string;
}): Promise<AccessibleSearchDocument[]>;
export declare function listAccessibleLexicalCandidates(input: AccessibleLexicalCandidatesInput): Promise<{
    results: ContextSearchResult[];
    nextCursor?: string;
}>;
export declare function getCreativeContextItem(itemId: string, itemVersionId?: string): Promise<ContextDetail | null>;
export declare function appendMediaEnrichmentVersion(input: {
    mediaId: string;
    palette: string[];
    contentHash: string;
    caption: string | null;
    captionStatus: "pending" | "complete" | "failed" | "not-needed";
    ocrText: string | null;
}): Promise<{
    itemId: string;
    itemVersionId: string;
    mediaId: string;
    appended: boolean;
}>;
export declare function getCreativeContextItemByExternalId(input: {
    sourceId: string;
    externalId: string;
    itemId?: string;
    itemVersionId?: string;
    sourceVersion?: string;
}): Promise<ContextDetail | null>;
export declare function createEmbeddingSet(input: {
    name: string;
    provider: string;
    family: string;
    model: string;
    version: string;
    dimensions: number;
    metric?: EmbeddingSet["metric"];
    metadata?: Record<string, unknown>;
}): Promise<EmbeddingSet>;
export declare function getActiveEmbeddingSet(input?: {
    family?: string;
    model?: string;
    version?: string;
}): Promise<EmbeddingSet | null>;
export declare function recordEmbeddingMetadata(input: {
    embeddingSetId: string;
    itemId: string;
    itemVersionId: string;
    chunkId?: string;
    targetType?: "item" | "chunk" | "media";
    targetId?: string;
    vectorKey: string;
    dimensions: number;
    checksum?: string;
}): Promise<ContextEmbeddingMetadata>;
export declare function listEmbeddingMetadata(input: {
    embeddingSetId: string;
    itemVersionIds?: string[];
    sourceIds?: string[];
    packId?: string;
    kinds?: string[];
    tags?: string[];
    colors?: string[];
    updatedAfter?: string;
    updatedBefore?: string;
    statuses?: ContextItemSummary["status"][];
}): Promise<ContextEmbeddingMetadata[]>;
export declare function recordContextFeedback(input: {
    itemId: string;
    itemVersionId?: string;
    signal: ContextFeedbackSignal;
    note?: string;
}): Promise<{
    recorded: true;
}>;
export declare function reviewContextItems(input: {
    sourceId: string;
    operation: "list" | "approve" | "exclude" | "exemplar" | "normal" | "ignore" | "star" | "unstar" | "deprecate" | "restore";
    itemIds?: string[];
    limit?: number;
    queue?: "restricted" | "all";
}): Promise<{
    items: ContextReviewItem[];
    updated: number;
}>;
//# sourceMappingURL=content.d.ts.map