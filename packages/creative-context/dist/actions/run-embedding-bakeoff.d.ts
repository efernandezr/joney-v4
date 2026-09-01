declare const _default: import("@agent-native/core/action").ActionDefinition<{
    confirmProviderCosts: true;
}, {
    winner: import("../types.js").EmbeddingSet;
    results: {
        family: string;
        provider: "cohere" | "gemini" | "voyage" | (string & {});
        model: string;
        version: string;
        dimensions: number;
        metrics: import("../eval/index.js").RetrievalEvalMetrics;
    }[];
}>;
export default _default;
//# sourceMappingURL=run-embedding-bakeoff.d.ts.map