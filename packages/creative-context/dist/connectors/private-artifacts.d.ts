import { type PrivateBlobHandle } from "@agent-native/core/private-blob";
import type { ContextMediaInput } from "../types.js";
import type { ContextConnectorExecutionContext } from "./types.js";
export declare function storePrivateArtifact(input: {
    data: Uint8Array;
    filename: string;
    mimeType?: string;
    context: ContextConnectorExecutionContext;
    metadata?: Record<string, string | number | boolean | null | undefined>;
}): Promise<{
    handle: PrivateBlobHandle;
    reference: string;
    contentHash: string;
    palette: string[];
}>;
export declare function rehostRemoteMedia(input: {
    url: string;
    provenanceUrl?: string;
    filename: string;
    kind: ContextMediaInput["kind"];
    mimeType?: string;
    context: ContextConnectorExecutionContext;
    metadata?: Record<string, unknown>;
}): Promise<ContextMediaInput>;
export declare function fetchRemoteArtifact(url: string, context: ContextConnectorExecutionContext): Promise<{
    data: Uint8Array;
    mimeType?: string;
    finalUrl: string;
}>;
export declare function sanitizeProvenanceUrl(value: string): string;
export declare function sanitizeRemoteArtifact(input: {
    data: Uint8Array;
    mimeType?: string;
    filename?: string;
}): Uint8Array;
export declare function readPrivateArtifact(handle: PrivateBlobHandle, context: ContextConnectorExecutionContext): Promise<Uint8Array>;
export declare function serializePrivateBlobHandle(handle: PrivateBlobHandle): string;
export declare function parsePrivateBlobHandle(value: unknown): PrivateBlobHandle | null;
//# sourceMappingURL=private-artifacts.d.ts.map