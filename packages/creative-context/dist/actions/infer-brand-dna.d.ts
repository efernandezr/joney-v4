declare const _default: import("@agent-native/core/action").ActionDefinition<{
    sourceId: string;
    profileId?: string | undefined;
}, {
    proposal: null;
    reason: "no-hydrated-evidence";
    drift?: undefined;
    preview?: undefined;
} | {
    proposal: null;
    reason: "no-material-drift";
    drift: {
        score: number;
        threshold: number;
        comparedVersionId: string;
    };
    preview?: undefined;
} | {
    reason?: undefined;
    drift?: undefined;
    proposal: {
        profile: import("../types.js").BrandProfile;
        dna: import("../types.js").BrandDnaVersion;
    };
    preview: {
        profileId: string;
        dnaVersionId: string;
        contentHash: string;
        summary: string;
        colors: string[];
        fonts: string[];
        layoutThumbnails: {
            itemId: string;
            itemVersionId: string;
            hasThumbnail: boolean;
            title: string;
        }[];
        voiceLine: null;
        voiceDescriptors: ("concise" | "direct" | "formal" | "optimistic" | "technical" | "warm")[];
        voiceEvidenceStats: {
            sentenceCount: number;
            averageSentenceWords: number;
            shortHeadingCount: number;
            ctaTokenCount: number;
        };
        confidence: number;
        driftScore: number;
        materialDriftThreshold: number;
    };
}>;
export default _default;
//# sourceMappingURL=infer-brand-dna.d.ts.map