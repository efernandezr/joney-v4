import type { ContextJob } from "../types.js";
export interface RebuildBatchResult {
    processed: number;
    indexed: number;
    afterChunkId: string | null;
    hasMore: boolean;
    lane: "portable-lexical" | "postgres-fts" | "pgvector";
    embeddingSetId?: string;
    mediaQueued?: number;
}
export declare function rebuildFtsBatch(job: ContextJob): Promise<RebuildBatchResult>;
export declare function rebuildVectorBatch(job: ContextJob): Promise<RebuildBatchResult>;
//# sourceMappingURL=rebuild.d.ts.map