import type { ContextConnectorExecutionContext } from "./types.js";
export type ContextRootRecommendationProvider = "notion" | "google-slides" | "figma";
export interface ContextRootRecommendation {
    externalId: string;
    provider: ContextRootRecommendationProvider;
    kind: "page" | "presentation" | "file";
    title: string;
    canonicalUrl?: string;
    sourceModifiedAt?: string;
    containerRef?: string;
    metadata?: Record<string, unknown>;
}
export declare function recommendContextRoots(input: {
    provider: ContextRootRecommendationProvider;
    connectionId?: string;
    limit?: number;
    figmaProjectId?: string;
    figmaTeamId?: string;
}, context: ContextConnectorExecutionContext): Promise<{
    recommendations: ContextRootRecommendation[];
    persisted: false;
    requiresExplicitBoundary: true;
    unavailableReason?: string;
}>;
//# sourceMappingURL=recommendations.d.ts.map