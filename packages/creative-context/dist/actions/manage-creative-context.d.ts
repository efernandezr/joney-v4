declare const _default: import("@agent-native/core/action").ActionDefinition<{
    operation: "create";
    name: string;
    description?: string | null | undefined;
    kind: "default" | "specialty";
    brandProfileId?: string | null | undefined;
    approvalPolicy?: "admins-only" | "open" | "review" | undefined;
} | {
    operation: "update";
    contextId: string;
    patch: {
        name?: string | undefined;
        description?: string | null | undefined;
        brandProfileId?: string | null | undefined;
        approvalPolicy?: "admins-only" | "open" | "review" | undefined;
    };
} | {
    operation: "archive";
    contextId: string;
} | {
    operation: "set-app-default";
    contextId: string;
    appId: string;
}, {
    context: import("../types.js").CreativeContextSummary | null;
}>;
export default _default;
//# sourceMappingURL=manage-creative-context.d.ts.map