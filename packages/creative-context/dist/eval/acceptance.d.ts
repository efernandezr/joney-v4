import { z } from "zod";
export interface ContextAcceptanceArtifact {
    output: string;
    usedContextKeys: readonly string[];
    contextPackId?: string | null;
    provenanceKeys?: readonly string[];
}
export interface ContextAcceptanceCase {
    id: string;
    prompt: string;
    reference: string;
    expectedContextKeys: readonly string[];
    requiredTerms: readonly string[];
    forbiddenTerms: readonly string[];
    contextOff: ContextAcceptanceArtifact;
    contextOn: ContextAcceptanceArtifact;
}
export interface ContextAcceptanceThresholds {
    minimumCases: number;
    minimumContextOnWinRate: number;
    minimumRequiredTermCoverage: number;
    minimumMeanEditDistanceReduction: number;
}
export declare const ContextAcceptanceReportSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    corpusId: z.ZodString;
    runId: z.ZodString;
    cases: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        contextOff: z.ZodObject<{
            outputHash: z.ZodString;
            requiredTermCoverage: z.ZodNumber;
            forbiddenHits: z.ZodArray<z.ZodString>;
            editDistance: z.ZodNumber;
            usedContextKeys: z.ZodArray<z.ZodString>;
            contextPackId: z.ZodNullable<z.ZodString>;
            provenanceKeys: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        contextOn: z.ZodObject<{
            outputHash: z.ZodString;
            requiredTermCoverage: z.ZodNumber;
            forbiddenHits: z.ZodArray<z.ZodString>;
            editDistance: z.ZodNumber;
            usedContextKeys: z.ZodArray<z.ZodString>;
            contextPackId: z.ZodNullable<z.ZodString>;
            provenanceKeys: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        winner: z.ZodEnum<{
            "context-off": "context-off";
            "context-on": "context-on";
            tie: "tie";
        }>;
        contextPackRecorded: z.ZodBoolean;
        provenanceComplete: z.ZodBoolean;
        optOutStructurallyClean: z.ZodBoolean;
    }, z.core.$strip>>;
    summary: z.ZodObject<{
        caseCount: z.ZodNumber;
        contextOnWins: z.ZodNumber;
        contextOffWins: z.ZodNumber;
        ties: z.ZodNumber;
        contextOnWinRate: z.ZodNumber;
        contextOnRequiredTermCoverage: z.ZodNumber;
        meanEditDistanceReduction: z.ZodNumber;
        forbiddenOutputHits: z.ZodNumber;
        missingContextPacks: z.ZodNumber;
        missingProvenance: z.ZodNumber;
        optOutContamination: z.ZodNumber;
    }, z.core.$strip>;
    thresholds: z.ZodObject<{
        minimumCases: z.ZodNumber;
        minimumContextOnWinRate: z.ZodNumber;
        minimumRequiredTermCoverage: z.ZodNumber;
        minimumMeanEditDistanceReduction: z.ZodNumber;
    }, z.core.$strip>;
    gates: z.ZodObject<{
        passed: z.ZodBoolean;
        failures: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    manualBlindPreference: z.ZodObject<{
        status: z.ZodEnum<{
            complete: "complete";
            pending: "pending";
        }>;
        scoredTrials: z.ZodNumber;
        contextOnPreferenceRate: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ContextAcceptanceReport = z.infer<typeof ContextAcceptanceReportSchema>;
export declare function runContextAcceptanceEvaluation(input: {
    corpusId: string;
    cases: readonly ContextAcceptanceCase[];
    thresholds?: Partial<ContextAcceptanceThresholds>;
}): ContextAcceptanceReport;
export declare function assertContextAcceptanceGates(report: ContextAcceptanceReport): void;
export interface BlindPreferenceWorksheetRow {
    caseId: string;
    prompt: string;
    candidateA: string;
    candidateB: string;
}
export interface BlindPreferenceAnswerKey {
    caseId: string;
    contextOnCandidate: "A" | "B";
}
export declare function createBlindPreferencePacket(cases: readonly ContextAcceptanceCase[]): {
    worksheet: BlindPreferenceWorksheetRow[];
    answerKey: BlindPreferenceAnswerKey[];
};
export declare function scoreBlindPreferences(answerKey: readonly BlindPreferenceAnswerKey[], scores: Readonly<Record<string, "A" | "B" | "tie">>): {
    scoredTrials: number;
    contextOnPreferenceRate: number;
};
//# sourceMappingURL=acceptance.d.ts.map