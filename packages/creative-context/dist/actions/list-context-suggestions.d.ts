declare const _default: import("@agent-native/core/action").ActionDefinition<{
    kind?: "canonical-logo" | "layout-template" | undefined;
    status?: "confirmed" | "demoted" | "promoted" | "proposed" | "rejected" | undefined;
    limit?: unknown;
}, {
    suggestions: import("../types.js").CreativeContextSuggestion[];
    capabilities: {
        canonicalLogo: boolean;
        layoutTemplate: boolean;
    };
}>;
export default _default;
//# sourceMappingURL=list-context-suggestions.d.ts.map