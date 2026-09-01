declare const _default: import("@agent-native/core/action").ActionDefinition<{
    provider: "figma" | "google-slides" | "notion";
    connectionId?: string | undefined;
    limit?: unknown;
    figmaProjectId?: string | undefined;
    figmaTeamId?: string | undefined;
}, {
    recommendations: import("../connectors/recommendations.js").ContextRootRecommendation[];
    persisted: false;
    requiresExplicitBoundary: true;
    unavailableReason?: string;
}>;
export default _default;
//# sourceMappingURL=recommend-context-roots.d.ts.map