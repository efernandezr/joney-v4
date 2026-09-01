declare const _default: import("@agent-native/core/action").ActionDefinition<{
    profileId?: string | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    dna: {
        [x: string]: unknown;
        summary: string;
    };
    evidenceItemIds?: string[] | undefined;
}, {
    profile: import("../types.js").BrandProfile;
    dna: import("../types.js").BrandDnaVersion;
}>;
export default _default;
//# sourceMappingURL=propose-brand-dna.d.ts.map