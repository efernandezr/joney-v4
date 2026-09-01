import type { EmbeddingFamily, MultimodalEmbeddingInput } from "../embeddings/types.js";
export { assertContextAcceptanceGates, ContextAcceptanceReportSchema, createBlindPreferencePacket, runContextAcceptanceEvaluation, scoreBlindPreferences, type BlindPreferenceAnswerKey, type BlindPreferenceWorksheetRow, type ContextAcceptanceArtifact, type ContextAcceptanceCase, type ContextAcceptanceReport, type ContextAcceptanceThresholds, } from "./acceptance.js";
export { CREATIVE_CONTEXT_ACCEPTANCE_CASES } from "./acceptance-fixtures.js";
export { CREATIVE_CONTEXT_INK_IMAGE_BASE64, CREATIVE_CONTEXT_GOLD_DOCUMENTS, CREATIVE_CONTEXT_GOLD_TASKS, CREATIVE_CONTEXT_PURPLE_IMAGE_BASE64, type CreativeContextGoldDocument, } from "./fixtures.js";
export interface RetrievalEvalTask {
    id: string;
    query: MultimodalEmbeddingInput;
    relevantKeys: readonly string[];
    forbiddenKeys?: readonly string[];
}
export interface RetrievalEvalMetrics {
    taskCount: number;
    top5Recall: number;
    meanReciprocalRank: number;
    permissionLeaks: number;
}
export interface ContextQualityTrial {
    id: string;
    preferred: "context-on" | "context-off" | "tie";
    baselineEditDistance: number;
    contextEditDistance: number;
}
export interface ContextQualityMetrics {
    trialCount: number;
    contextPreferenceRate: number;
    meanEditDistanceReduction: number;
}
export interface CreativeContextCorrectnessEvidence {
    permissionLeaks: number;
    generationsMissingPacks: number;
    generationsMissingProvenance: number;
    importsResumable: boolean;
    importsIdempotent: boolean;
    importsDeterministic: boolean;
    revocationRemovesAccess: boolean;
    lexicalLaneRebuilds: boolean;
    vectorLaneRebuilds: boolean;
    connectorsPassing: readonly string[];
    consumersUsingReuseLadder: readonly string[];
    nativeCodeRetrievalPassing: readonly string[];
    nativeCloneFidelityPassing: readonly string[];
    nativeCloneVersionsPinned: boolean;
    supportedNativeElementsEditable: boolean;
    runtimeExcludesFullResolutionReferenceRenders: boolean;
    contextOptOutExcludesAllContext: boolean;
    contextOnBeatsContextOff: boolean;
}
export declare function evaluateRankings(tasks: readonly RetrievalEvalTask[], rankings: Readonly<Record<string, readonly string[]>>): RetrievalEvalMetrics;
export declare function evaluateContextQuality(trials: readonly ContextQualityTrial[]): ContextQualityMetrics;
export declare function creativeContextCompletionFailures(evidence: CreativeContextCorrectnessEvidence): string[];
export declare function assertCreativeContextCompletionGates(evidence: CreativeContextCorrectnessEvidence): void;
export declare function bakeOffEmbeddingFamilies(input: {
    families: readonly EmbeddingFamily[];
    documents: Readonly<Record<string, MultimodalEmbeddingInput>>;
    tasks: readonly RetrievalEvalTask[];
    allowedDocumentKeys?: readonly string[];
    topK?: number;
}): Promise<{
    family: EmbeddingFamily;
    metrics: RetrievalEvalMetrics;
}[]>;
export declare function embeddingBakeoffPasses(metrics: RetrievalEvalMetrics): boolean;
//# sourceMappingURL=index.d.ts.map