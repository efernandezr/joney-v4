import type { ContextImportConnectorRegistry } from "../connectors/registry.js";
import type { ContextConnectorExecutionContext } from "../connectors/types.js";
import * as defaultSchema from "../schema/index.js";
import type { PgVectorAdapter } from "../types.js";
import type { CreativeContextElementProvenance, ContextMedia } from "../types.js";
export type CreativeContextSchema = typeof defaultSchema;
export type CreativeContextGetDb = () => any;
export interface CreativeContextServerContext {
    getDb: CreativeContextGetDb;
    schema: CreativeContextSchema;
    vectorAdapter?: PgVectorAdapter;
    connectors: ContextImportConnectorRegistry;
    connectorContext: ContextConnectorExecutionContext;
    projections?: CreativeContextProjectionAdapters;
    enrichment?: CreativeContextEnrichmentAdapters;
}
export interface CreativeContextProjectionAdapters {
    canonicalLogo?: {
        apply(input: {
            profileId: string | null;
            itemId: string;
            itemVersionId: string;
            payload: Record<string, unknown>;
        }): Promise<void>;
    };
    layoutTemplate?: {
        promote(input: {
            suggestionId: string;
            itemId: string;
            itemVersionId: string;
            projectionItemId: string;
            htmlSnapshot: string | null;
        }): Promise<void>;
        demote(input: {
            suggestionId: string;
            projectionItemId: string | null;
        }): Promise<void>;
    };
    generation?: {
        record(input: {
            appId: string;
            artifactType: string;
            artifactId: string;
            contextPackId: string | null;
            elementProvenance: readonly CreativeContextElementProvenance[];
        }): Promise<void>;
    };
    media?: {
        project(input: {
            sourceId: string;
            itemId: string;
            itemVersionId: string;
            media: ContextMedia;
            sourceType: "brand-import";
            dedupeKey: string;
        }): Promise<void>;
    };
}
export interface CreativeContextEnrichmentAdapters {
    captionImage?(input: {
        data: Uint8Array;
        mimeType: string;
        itemId: string;
        itemVersionId: string;
        mediaId: string;
    }): Promise<string | null>;
    ocrImage?(input: {
        data: Uint8Array;
        mimeType: string;
        itemId: string;
        itemVersionId: string;
        mediaId: string;
    }): Promise<string | null>;
}
export declare function configureCreativeContext(context?: Partial<CreativeContextServerContext>): CreativeContextServerContext;
export declare function getCreativeContext(): CreativeContextServerContext;
//# sourceMappingURL=context.d.ts.map