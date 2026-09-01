declare const _default: import("@agent-native/core/action").ActionDefinition<{
    operation: "create";
    name: string;
    description?: string | null | undefined;
    brandDnaVersionId?: string | null | undefined;
    baseContextId?: string | null | undefined;
    specialtyContextId?: string | null | undefined;
    selectionReason?: string | null | undefined;
    members: {
        itemId: string;
        itemVersionId?: string | undefined;
        reason?: string | undefined;
    }[];
    pinned?: boolean | undefined;
} | {
    operation: "derive";
    packId: string;
    name?: string | undefined;
    description?: string | null | undefined;
    addMembers?: {
        itemId: string;
        itemVersionId?: string | undefined;
        reason?: string | undefined;
    }[] | undefined;
    removeItemIds?: string[] | undefined;
    brandDnaVersionId?: string | null | undefined;
    pinned?: boolean | undefined;
} | {
    operation: "archive" | "pin" | "unpin";
    packId: string;
}, {
    pack: import("../types.js").ContextPackDetail;
    deleted: boolean;
}>;
export default _default;
//# sourceMappingURL=manage-context-pack.d.ts.map