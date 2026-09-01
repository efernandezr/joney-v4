import type { CreativeContextElementProvenance, CreativeContextReuseLabel, CreativeContextSummary } from "../types.js";
import { type GenerationArtifactAccessTarget } from "./generation-artifact-access.js";
import { type IsolatedRecordPayload } from "./isolated-a2a.js";
export type CreativeGenerationRole = "slides" | "design" | "assets" | "content" | "analytics";
export type CreativeContextModeOverride = "off";
export declare function selectSemanticSpecialty(contexts: readonly CreativeContextSummary[], query: string): CreativeContextSummary | null;
export declare function mergeCreativeContextReuseLabels(previous: readonly CreativeContextReuseLabel[], next: readonly CreativeContextReuseLabel[]): CreativeContextReuseLabel[];
export declare function replaceCreativeContextElementProvenance(previous: readonly CreativeContextElementProvenance[], next: readonly CreativeContextElementProvenance[]): CreativeContextElementProvenance[];
export interface ResolveGenerationCreativeContextInput {
    query?: string;
    role: CreativeGenerationRole;
    limit?: number;
    contextPackId?: string;
    contextPackSource?: "explicit" | "inherited";
    /** Forwarded by isolated callers; local callers normally use app state. */
    selectedContextId?: string | null;
    contextModeOverride?: CreativeContextModeOverride;
}
export declare function validateCreativeContextReuseLabels(labels: CreativeContextReuseLabel[], options?: {
    allowedEvidence?: ReadonlySet<string>;
    generatedOnly?: boolean;
}): CreativeContextReuseLabel[];
export declare function resolveGenerationCreativeContext(input: ResolveGenerationCreativeContextInput): Promise<{
    contextMode: "auto" | "off" | "pinned";
    contextPackId: string | null;
    reuseLabels: {
        itemId?: string | undefined;
        itemVersionId?: string | undefined;
        kind: string;
        label: string;
        dataRole: "untrusted-reference";
        elementId?: string | undefined;
        influence?: "adapted" | "generated" | "reference-conditioned" | "reused" | undefined;
    }[];
    results: {
        itemId: string;
        itemVersionId: string;
        kind: string;
        title: string;
        excerpt: string;
        dataRole: "untrusted-reference";
    }[];
} | {
    contextMode: "auto";
    contextPackId: string;
    reuseLabels: {
        itemId: string;
        itemVersionId: string;
        kind: string;
        label: string;
        dataRole: "untrusted-reference";
    }[];
    results: {
        itemId: string;
        itemVersionId: string;
        chunkId: string | null;
        sourceId: string;
        sourceName: string;
        kind: string;
        canonicalUrl: string | null;
        mimeType: string | null;
        nativeArtifact: {
            app: string;
            format: string;
        } | null;
        chunkOrdinal: number;
        tags: string[];
        colors: string[];
        updatedAt: string;
        curationRank: import("../types.js").ContextItemSummary["curationRank"];
        starred: boolean;
        externalId: string;
        indexState: import("../types.js").ContextItemSummary["indexState"];
        inventoryOnly: boolean;
        priorReuseCount: number;
        helpfulFeedbackCount: number;
        body: undefined;
        summary: undefined;
        dataRole: "untrusted-reference";
        title: string;
        excerpt: string;
        score: number;
        reasons: string[];
        laneRanks: Record<string, number>;
        laneScores: Record<string, number>;
        pendingJobId: string | null;
    }[];
}>;
export declare function resolveGenerationCreativeContextLocal(input: ResolveGenerationCreativeContextInput): Promise<{
    contextMode: "pinned";
    contextPackId: string;
    reuseLabels: CreativeContextReuseLabel[];
    results: {
        itemId: string;
        itemVersionId: string;
        kind: string;
        title: string;
        excerpt: string;
        dataRole: "untrusted-reference";
    }[];
} | {
    contextMode: "off";
    contextPackId: null;
    reuseLabels: never[];
    results: never[];
} | {
    contextMode: "auto";
    contextPackId: null;
    reuseLabels: never[];
    results: never[];
} | {
    contextMode: "auto";
    contextPackId: string;
    reuseLabels: {
        itemId: string;
        itemVersionId: string;
        kind: string;
        label: string;
        dataRole: "untrusted-reference";
    }[];
    results: {
        itemId: string;
        itemVersionId: string;
        chunkId: string | null;
        sourceId: string;
        sourceName: string;
        kind: string;
        canonicalUrl: string | null;
        mimeType: string | null;
        nativeArtifact: {
            app: string;
            format: string;
        } | null;
        chunkOrdinal: number;
        tags: string[];
        colors: string[];
        updatedAt: string;
        curationRank: import("../types.js").ContextItemSummary["curationRank"];
        starred: boolean;
        externalId: string;
        indexState: import("../types.js").ContextItemSummary["indexState"];
        inventoryOnly: boolean;
        priorReuseCount: number;
        helpfulFeedbackCount: number;
        body: undefined;
        summary: undefined;
        dataRole: "untrusted-reference";
        title: string;
        excerpt: string;
        score: number;
        reasons: string[];
        laneRanks: Record<string, number>;
        laneScores: Record<string, number>;
        pendingJobId: string | null;
    }[];
}>;
export interface ValidateGenerationCreativeContextInput {
    contextPackId?: string | null;
    contextPackSource?: "explicit" | "inherited";
    reuseLabels?: CreativeContextReuseLabel[];
    reuseLabelsSource?: "explicit" | "inherited";
    contextModeOverride?: CreativeContextModeOverride;
}
export declare function validateGenerationCreativeContext(input: ValidateGenerationCreativeContextInput): Promise<{
    contextMode: "auto" | "off" | "pinned";
    contextPackId: string | null;
    reuseLabels: {
        itemId?: string | undefined;
        itemVersionId?: string | undefined;
        kind: string;
        label: string;
        dataRole: "untrusted-reference";
        elementId?: string | undefined;
        influence?: "adapted" | "generated" | "reference-conditioned" | "reused" | undefined;
    }[];
    results: {
        itemId: string;
        itemVersionId: string;
        kind: string;
        title: string;
        excerpt: string;
        dataRole: "untrusted-reference";
    }[];
}>;
export declare function validateGenerationCreativeContextLocal(input: ValidateGenerationCreativeContextInput): Promise<{
    contextMode: "off";
    contextPackId: null;
    reuseLabels: CreativeContextReuseLabel[];
    results: never[];
} | {
    contextMode: "pinned";
    contextPackId: string;
    results: {
        itemId: string;
        itemVersionId: string;
        kind: string;
        title: string;
        excerpt: string;
        dataRole: "untrusted-reference";
    }[];
    reuseLabels: CreativeContextReuseLabel[];
} | {
    contextMode: "auto";
    contextPackId: null;
    reuseLabels: CreativeContextReuseLabel[];
    results: never[];
}>;
export declare function recordGenerationCreativeContext(input: IsolatedRecordPayload, options?: {
    db?: any;
    artifactAccess?: GenerationArtifactAccessTarget;
}): Promise<import("../types.js").CreativeContextGenerationRecord>;
export declare function getGenerationCreativeContext(input: {
    appId: string;
    artifactType: string;
    artifactId: string;
}, options?: {
    artifactAccess?: GenerationArtifactAccessTarget;
    db?: any;
}): Promise<import("../types.js").CreativeContextGenerationRecord | null>;
//# sourceMappingURL=generation-context.d.ts.map