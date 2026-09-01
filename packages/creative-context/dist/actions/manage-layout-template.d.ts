declare const _default: import("@agent-native/core/action").ActionDefinition<{
    operation: "propose";
    profileId?: string | undefined;
    itemId: string;
    itemVersionId?: string | undefined;
    reason?: string | undefined;
    payload?: Record<string, unknown> | undefined;
} | {
    operation: "demote" | "promote" | "reject";
    suggestionId: string;
}, import("../types.js").CreativeContextSuggestion>;
export default _default;
//# sourceMappingURL=manage-layout-template.d.ts.map