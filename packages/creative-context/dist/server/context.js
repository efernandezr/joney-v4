import { createGetDb, getDbExec, isPostgres } from "@agent-native/core/db";
import { createDefaultContextConnectorExecutionContext, createDefaultContextImportConnectorRegistry, } from "../connectors/index.js";
import * as defaultSchema from "../schema/index.js";
import { deletePgVectors, queryPgVectorIndex, upsertPgVector, } from "../vector/pgvector.js";
const defaultGetDb = createGetDb(defaultSchema);
const CONTEXT_KEY = Symbol.for("@agent-native/creative-context.context");
function defaultVectorAdapter() {
    if (!isPostgres())
        return undefined;
    return {
        async upsert(input) {
            const vectorKey = input.embeddingId;
            await upsertPgVector(getDbExec(), {
                vectorKey,
                embeddingSetId: input.embeddingSetId,
                dimensions: input.vector.length,
                vector: input.vector,
            });
            return { vectorKey };
        },
        async search(input) {
            const hits = await queryPgVectorIndex(getDbExec(), {
                embeddingSetId: input.embeddingSetId,
                dimensions: input.vector.length,
                vector: input.vector,
                limit: input.limit,
                allowedVectorKeys: input.allowedVectorKeys,
            });
            return hits.map((hit) => ({
                embeddingId: hit.vectorKey,
                score: hit.score,
            }));
        },
        async delete(input) {
            await deletePgVectors(getDbExec(), {
                dimensions: input.dimensions,
                vectorKeys: [input.vectorKey],
            });
        },
    };
}
export function configureCreativeContext(context = {}) {
    const appId = context.connectorContext?.appId ?? "creative-context";
    const configured = {
        getDb: context.getDb ?? defaultGetDb,
        schema: context.schema ?? defaultSchema,
        vectorAdapter: context.vectorAdapter ?? defaultVectorAdapter(),
        connectors: context.connectors ?? createDefaultContextImportConnectorRegistry(),
        connectorContext: {
            ...createDefaultContextConnectorExecutionContext({ appId }),
            ...context.connectorContext,
            appId,
        },
        projections: context.projections,
        enrichment: context.enrichment,
    };
    globalThis[CONTEXT_KEY] = configured;
    return configured;
}
export function getCreativeContext() {
    return (globalThis[CONTEXT_KEY] ?? configureCreativeContext());
}
//# sourceMappingURL=context.js.map