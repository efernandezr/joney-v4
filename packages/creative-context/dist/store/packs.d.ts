import type { ContextPackDetail, ContextPackMemberInput, ContextPackSummary } from "../types.js";
export declare function assertImmutablePackMembership(operation: string): never;
export declare function createContextPack(input: {
    name: string;
    description?: string | null;
    derivedFromPackId?: string;
    brandDnaVersionId?: string | null;
    contextMode?: string;
    baseContextId?: string | null;
    specialtyContextId?: string | null;
    selectionReason?: string | null;
    request?: Record<string, unknown>;
    members: ContextPackMemberInput[];
    pinned?: boolean;
}): Promise<ContextPackDetail>;
export declare function deriveContextPack(input: {
    packId: string;
    name?: string;
    description?: string | null;
    addMembers?: ContextPackMemberInput[];
    removeItemIds?: string[];
    brandDnaVersionId?: string | null;
    pinned?: boolean;
}): Promise<ContextPackDetail>;
export declare function setContextPackPinned(packId: string, pinned: boolean): Promise<ContextPackDetail>;
export declare function archiveContextPack(packId: string): Promise<ContextPackDetail>;
export declare function listContextPacks(input: {
    limit: number;
    cursor?: string;
    includeArchived?: boolean;
}): Promise<{
    packs: ContextPackSummary[];
    nextCursor?: string;
}>;
export declare function getContextPack(packId: string): Promise<ContextPackDetail | null>;
//# sourceMappingURL=packs.d.ts.map