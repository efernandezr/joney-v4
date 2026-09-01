import type { ContextCurationRank, ContextCurationStatus, ContextEdgeInput, ContextMediaInput, NormalizedContextChunk, NormalizedContextItem, UpstreamAccess } from "../types.js";
export declare const MAX_SEARCHABLE_CONTENT_BYTES: number;
export declare const MAX_SUMMARY_BYTES: number;
export declare const MAX_NATIVE_CONTENT_BYTES: number;
export declare const MAX_METADATA_BYTES: number;
export declare const MAX_MEDIA_TEXT_BYTES: number;
export declare const MAX_MEDIA_LOCATOR_BYTES: number;
export interface NormalizeContextItemInput {
    externalId: string;
    kind: string;
    title: string;
    content: string;
    preserveContent?: boolean;
    canonicalUrl?: string;
    mimeType?: string;
    summary?: string;
    sourceModifiedAt?: string;
    sourceVersion?: string;
    rawSnapshotBlobRef?: string;
    parseStatus?: "pending" | "parsed" | "failed";
    parseError?: string;
    upstreamAccess?: UpstreamAccess;
    curationStatus?: ContextCurationStatus;
    curationRank?: ContextCurationRank;
    thumbnailBlobRef?: string;
    provenance?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    chunks?: NormalizedContextChunk[];
    media?: ContextMediaInput[];
    edges?: ContextEdgeInput[];
}
export declare function normalizeContextItem(input: NormalizeContextItemInput): NormalizedContextItem;
export declare function assertContextItemSqlTextLimits(item: Pick<NormalizedContextItem, "content" | "summary" | "mimeType" | "provenance" | "metadata" | "chunks" | "media" | "edges">): void;
export declare function hashContextContent(value: unknown): string;
export declare function hashContextVersion(item: Omit<NormalizedContextItem, "contentHash">): string;
export declare function chunkContextText(input: string, maxChars?: number): NormalizedContextChunk[];
export declare function collectProviderText(value: unknown, options?: {
    skipKeys?: readonly string[];
    maxChars?: number;
}): string;
export declare function normalizeWhitespace(value: string): string;
//# sourceMappingURL=normalize.d.ts.map