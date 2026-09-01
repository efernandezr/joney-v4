import type { BrandDnaPayload } from "../types.js";
import { listAccessibleSearchDocuments } from "./content.js";
export declare const BRAND_DNA_MATERIAL_DRIFT_THRESHOLD = 0.2;
export declare function brandDnaDriftScore(previous: BrandDnaPayload, candidate: BrandDnaPayload): number;
export declare function selectRepresentativeBrandDocuments(documents: Awaited<ReturnType<typeof listAccessibleSearchDocuments>>, limit?: number): import("./content.js").AccessibleSearchDocument[];
export declare function inferBrandDnaProposalFromCorpus(input: {
    sourceId: string;
    profileId?: string;
    materialDriftThreshold?: number;
}): Promise<{
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
//# sourceMappingURL=inference.d.ts.map