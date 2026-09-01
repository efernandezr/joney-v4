declare const _default: import("@agent-native/core/action").ActionDefinition<{
    status?: "active" | "archived" | "error" | "paused" | undefined;
    healthStatus?: "error" | "healthy" | "needs_setup" | "paused" | "stale" | undefined;
    kind?: string | undefined;
    limit?: unknown;
    cursor?: string | undefined;
}, {
    sources: import("../types.js").ContextSourceSummary[];
    nextCursor?: string;
}>;
export default _default;
//# sourceMappingURL=list-context-sources.d.ts.map