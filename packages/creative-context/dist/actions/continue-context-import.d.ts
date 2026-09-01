declare const _default: import("@agent-native/core/action").ActionDefinition<{
    jobId: string;
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
//# sourceMappingURL=continue-context-import.d.ts.map