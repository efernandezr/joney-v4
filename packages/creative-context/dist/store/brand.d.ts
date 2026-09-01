import type { BrandDnaPayload, BrandDnaVersion, BrandProfile } from "../types.js";
export declare function getBrandProfile(input: {
    profileId?: string;
}): Promise<{
    profile: BrandProfile | null;
    dna: BrandDnaVersion | null;
    versions: BrandDnaVersion[];
}>;
export declare function getPublishedBrandDna(profileId: string): Promise<BrandDnaVersion | null>;
export declare function previewBrandProfilePromotion(profileId: string): Promise<{
    profileId: string;
    profileName: string;
    dnaVersionId: string;
    targetOrgId: string;
}>;
export declare function promoteBrandProfileToOrg(profileId: string, confirmation: {
    profileName: string;
    dnaVersionId: string;
    targetOrgId: string;
}): Promise<{
    profile: BrandProfile;
    dna: BrandDnaVersion;
}>;
export declare function findBrandProfileIdForInferenceSource(sourceId: string): Promise<string | null>;
export declare function publishBrandDna(input: {
    profileId: string;
    proposalVersionId: string;
    confirmation: {
        proposalVersionId: string;
        contentHash: string;
    };
}): Promise<{
    profile: BrandProfile;
    dna: BrandDnaVersion;
}>;
export declare function saveBrandDnaCandidate(input: {
    profileId?: string;
    name?: string;
    description?: string | null;
    dna: BrandDnaPayload;
    evidenceItemIds?: string[];
    status: "draft" | "proposed";
}): Promise<{
    profile: BrandProfile;
    dna: BrandDnaVersion;
}>;
//# sourceMappingURL=brand.d.ts.map