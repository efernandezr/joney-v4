declare const _default: import("@agent-native/core/action").ActionDefinition<{
    operation: "preview-promotion";
    profileId: string;
} | {
    operation: "promote-to-org";
    profileId: string;
    confirmation: {
        profileName: string;
        dnaVersionId: string;
        targetOrgId: string;
    };
}, {
    promotionPreview: {
        profileId: string;
        profileName: string;
        dnaVersionId: string;
        targetOrgId: string;
    };
    promoted?: undefined;
} | {
    promotionPreview?: undefined;
    promoted: {
        profile: import("../types.js").BrandProfile;
        dna: import("../types.js").BrandDnaVersion;
    };
}>;
export default _default;
//# sourceMappingURL=manage-brand-profile.d.ts.map