import { getDbExec, isPostgres } from "@agent-native/core/db";
import { inArray } from "drizzle-orm";
import { availableEmbeddingFamilies } from "../embeddings/providers.js";
import { upsertPostgresFtsDocument } from "../search/postgres-fts.js";
import { getCreativeContext } from "../server/context.js";
import { sha256 } from "../store/helpers.js";
import { createJob, getActiveEmbeddingSet, getCreativeContextItem, listAccessibleSearchDocuments, recordEmbeddingMetadata, } from "../store/index.js";
import { PGVECTOR_REQUIRED_MESSAGE } from "../vector/pgvector.js";
const MAX_REBUILD_BATCH = 500;
const EMBEDDING_BATCH = 16;
function requestedItemIds(job) {
    const value = job.request.itemIds;
    return Array.isArray(value)
        ? value.filter((entry) => typeof entry === "string" && entry.length > 0)
        : undefined;
}
function rebuildLimit(job) {
    const eagerLimit = Number(job.budget?.eagerLimit ?? MAX_REBUILD_BATCH);
    return Math.max(1, Math.min(MAX_REBUILD_BATCH, Number.isFinite(eagerLimit) ? Math.floor(eagerLimit) : MAX_REBUILD_BATCH));
}
async function loadBatch(job) {
    const checkpoint = job.checkpoint ?? {};
    return listAccessibleSearchDocuments({
        sourceIds: job.sourceId ? [job.sourceId] : undefined,
        itemIds: requestedItemIds(job),
        afterChunkId: typeof checkpoint.afterChunkId === "string"
            ? checkpoint.afterChunkId
            : undefined,
        limit: rebuildLimit(job),
    });
}
async function markIndexed(documents) {
    const itemIds = [...new Set(documents.map((document) => document.itemId))];
    if (!itemIds.length)
        return;
    const { getDb, schema } = getCreativeContext();
    await getDb()
        .update(schema.contextItems)
        .set({ indexState: "indexed" })
        .where(inArray(schema.contextItems.id, itemIds));
}
export async function rebuildFtsBatch(job) {
    const documents = await loadBatch(job);
    let indexed = 0;
    for (const document of documents) {
        const stored = await upsertPostgresFtsDocument(getDbExec(), {
            chunkId: document.chunkId,
            itemVersionId: document.itemVersionId,
            title: document.title,
            summary: document.summary,
            body: document.body,
        });
        if (stored)
            indexed += 1;
    }
    await markIndexed(documents);
    return {
        processed: documents.length,
        indexed,
        afterChunkId: documents.at(-1)?.chunkId ?? null,
        hasMore: documents.length === rebuildLimit(job),
        lane: isPostgres() ? "postgres-fts" : "portable-lexical",
    };
}
async function resolveEmbeddingFamily() {
    const families = await availableEmbeddingFamilies();
    const set = await getActiveEmbeddingSet();
    if (!set) {
        throw new Error("Run the embedding bakeoff and persist its winner before rebuilding vectors.");
    }
    const family = set
        ? (families.find((candidate) => candidate.id === set.family &&
            candidate.model === set.model &&
            candidate.version === set.version) ?? null)
        : null;
    if (!family) {
        throw new Error(set
            ? `Embedding credentials for active family ${set.family} are unavailable.`
            : "Run the embedding bakeoff before rebuilding vectors.");
    }
    if (set.dimensions !== family.dimensions) {
        throw new Error("Active embedding set dimensions do not match its family.");
    }
    return { family, set };
}
function embeddingText(document) {
    return [document.title, document.summary, document.body]
        .filter(Boolean)
        .join("\n")
        .slice(0, 24_000);
}
export async function rebuildVectorBatch(job) {
    if (!isPostgres() || !getCreativeContext().vectorAdapter) {
        throw new Error(PGVECTOR_REQUIRED_MESSAGE);
    }
    const documents = await loadBatch(job);
    if (!documents.length) {
        return {
            processed: 0,
            indexed: 0,
            afterChunkId: null,
            hasMore: false,
            lane: "pgvector",
        };
    }
    const { family, set } = await resolveEmbeddingFamily();
    const vectorAdapter = getCreativeContext().vectorAdapter;
    let indexed = 0;
    for (let offset = 0; offset < documents.length; offset += EMBEDDING_BATCH) {
        const batch = documents.slice(offset, offset + EMBEDDING_BATCH);
        const texts = batch.map(embeddingText);
        const vectors = await family.embed(texts.map((text) => ({ text })), "document");
        if (vectors.length !== batch.length) {
            throw new Error("Embedding provider returned an incomplete rebuild batch.");
        }
        for (let index = 0; index < batch.length; index += 1) {
            const document = batch[index];
            const vector = vectors[index];
            if (vector.length !== set.dimensions) {
                throw new Error(`Embedding provider returned ${vector.length} dimensions; expected ${set.dimensions}.`);
            }
            const vectorKey = `creative-context:${set.id}:chunk:${document.chunkId}`;
            const stored = await vectorAdapter.upsert({
                embeddingId: vectorKey,
                embeddingSetId: set.id,
                vector,
            });
            await recordEmbeddingMetadata({
                embeddingSetId: set.id,
                itemId: document.itemId,
                itemVersionId: document.itemVersionId,
                chunkId: document.chunkId,
                targetType: "chunk",
                targetId: document.chunkId,
                vectorKey: stored.vectorKey,
                dimensions: vector.length,
                checksum: await sha256(texts[index]),
            });
            indexed += 1;
        }
    }
    await markIndexed(documents);
    const firstChunkVersions = [
        ...new Map(documents
            .filter((document) => document.chunkOrdinal === 0)
            .map((document) => [document.itemVersionId, document])).values(),
    ];
    const details = await Promise.all(firstChunkVersions.map((document) => getCreativeContextItem(document.itemId, document.itemVersionId)));
    const mediaIds = [
        ...new Set(details.flatMap((detail) => detail ? detail.media.map((media) => media.id) : [])),
    ];
    if (mediaIds.length) {
        await createJob({
            sourceId: job.sourceId ?? undefined,
            kind: "enrich-media",
            request: {
                operation: "rebuild-media-embeddings",
                mediaIds,
                embeddingSetId: set.id,
            },
            progressTotal: mediaIds.length,
            budget: {
                eagerLimit: Math.min(25, mediaIds.length),
                remainingMode: "durable-continuation",
            },
        });
    }
    return {
        processed: documents.length,
        indexed,
        afterChunkId: documents.at(-1)?.chunkId ?? null,
        hasMore: documents.length === rebuildLimit(job),
        lane: "pgvector",
        embeddingSetId: set.id,
        mediaQueued: mediaIds.length,
    };
}
//# sourceMappingURL=rebuild.js.map