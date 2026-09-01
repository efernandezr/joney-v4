declare const _default: import("@agent-native/core/action").ActionDefinition<{
    profileId?: string | undefined;
}, {
    profile: import("../types.js").BrandProfile | null;
    dna: {
        id: string;
        profileId: string;
        versionNumber: number;
        contentHash: string;
        status: "draft" | "proposed" | "published";
        evidence: Array<{
            itemId: string;
            itemVersionId: string;
        }>;
        createdAt: string;
        payload: unknown;
    } | null;
    versions: {
        id: string;
        profileId: string;
        versionNumber: number;
        contentHash: string;
        status: "draft" | "proposed" | "published";
        evidence: Array<{
            itemId: string;
            itemVersionId: string;
        }>;
        createdAt: string;
        payload: unknown;
    }[];
}>;
export default _default;
//# sourceMappingURL=get-brand-profile.d.ts.map