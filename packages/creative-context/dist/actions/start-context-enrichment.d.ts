declare const _default: import("@agent-native/core/action").ActionDefinition<{
    sourceId?: string | undefined;
    operation: "enrich-media" | "find-layout-suggestions" | "infer-brand-dna" | "metadata-refresh" | "rank-canonical-logo" | "rebuild-embeddings" | "rebuild-fts";
    itemIds?: string[] | undefined;
    eagerLimit?: unknown;
}, {
    job: {
        id: string;
        sourceId: string | null;
        kind: import("../types.js").ContextJobKind;
        status: import("../types.js").ContextJobStatus;
        mode: import("../types.js").ContextImportMode | null;
        progressCurrent: number;
        progressTotal: number | null;
        attempts: number;
        nextResumeAt: string | null;
        result: unknown;
        error: {} | null;
        createdAt: string;
        startedAt: string | null;
        completedAt: string | null;
    } | null;
}>;
export default _default;
//# sourceMappingURL=start-context-enrichment.d.ts.map