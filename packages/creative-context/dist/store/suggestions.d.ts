import type { CreativeContextSuggestion } from "../types.js";
export declare function listCreativeContextSuggestions(input?: {
    kind?: CreativeContextSuggestion["kind"];
    status?: CreativeContextSuggestion["status"];
    limit?: number;
}): Promise<CreativeContextSuggestion[]>;
export declare function proposeCreativeContextSuggestion(input: {
    kind: CreativeContextSuggestion["kind"];
    profileId?: string;
    itemId: string;
    itemVersionId?: string;
    reason?: string;
    payload?: Record<string, unknown>;
}): Promise<CreativeContextSuggestion>;
export declare function updateCreativeContextSuggestion(input: {
    suggestionId: string;
    kind: CreativeContextSuggestion["kind"];
    status: CreativeContextSuggestion["status"];
}): Promise<CreativeContextSuggestion>;
export declare function decideCanonicalLogoSuggestion(input: {
    suggestionId: string;
    decision: "confirm" | "reject";
}): Promise<CreativeContextSuggestion>;
export declare function resolveLayoutProjectionItemId(suggestionId: string, candidateId: unknown): Promise<string | null>;
export declare function applyLayoutTemplateSuggestion(input: {
    suggestionId: string;
    operation: "promote" | "demote" | "reject";
}): Promise<CreativeContextSuggestion>;
//# sourceMappingURL=suggestions.d.ts.map