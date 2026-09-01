import type { NormalizedContextItem } from "../types.js";
/** A native app resource reference supplied by a governed-context submission. */
export interface NativeCreativeResourceRef {
    appId: string;
    resourceType: string;
    resourceId: string;
    expectedUpdatedAt?: string;
}
export interface NativeResourceCaptureAdapter {
    appId: string;
    resourceType: string;
    /**
     * Reads only the version marker for resources visible to the active caller.
     * The Library calls this once per resource type with at most 100 ids.
     */
    listResourceVersions?(resourceIds: readonly string[]): Promise<Array<{
        resourceId: string;
        sourceModifiedAt: string | null;
    }>>;
    capture(reference: NativeCreativeResourceRef): Promise<{
        artifactKey: string;
        source: {
            name: string;
            kind: "native-app";
            externalRef?: string;
            upstreamAccess?: "available" | "restricted" | "unknown";
            containerOwnerVerifiedAt?: string;
            /** Server-derived from the app's source resource; never client input. */
            access?: {
                visibility: "private" | "org" | "public";
                canManage: boolean;
            };
        };
        items: NormalizedContextItem[];
        /** Persisted only as internal submission metadata; never action output. */
        privateMetadata?: Record<string, unknown>;
    }>;
}
export type NativeCreativeResourceUpdateState = "current" | "update-available" | "unknown";
export interface PublishedNativeCreativeResourceRef {
    key: string;
    appId: string;
    resourceType: string;
    resourceId: string;
    publishedSourceModifiedAt?: string | null;
}
export interface ResolvedNativeCreativeResourceUpdateStatus {
    key: string;
    state: NativeCreativeResourceUpdateState;
    reference: NativeCreativeResourceRef;
}
export declare function registerNativeResourceCaptureAdapter(adapter: NativeResourceCaptureAdapter): () => void;
export declare function unregisterNativeResourceCaptureAdapter(appId: string, resourceType: string): void;
export declare function captureNativeCreativeResource(reference: NativeCreativeResourceRef): Promise<{
    artifactKey: string;
    source: {
        name: string;
        kind: "native-app";
        externalRef?: string;
        upstreamAccess?: "available" | "restricted" | "unknown";
        containerOwnerVerifiedAt?: string;
        /** Server-derived from the app's source resource; never client input. */
        access?: {
            visibility: "private" | "org" | "public";
            canManage: boolean;
        };
    };
    items: NormalizedContextItem[];
    /** Persisted only as internal submission metadata; never action output. */
    privateMetadata?: Record<string, unknown>;
}>;
export declare function parseNativeCreativeArtifactKey(artifactKey: string): Omit<NativeCreativeResourceRef, "expectedUpdatedAt"> | null;
/**
 * Resolves update availability in bounded batches. Missing rows are omitted so
 * an inaccessible native resource is indistinguishable from a deleted one.
 */
export declare function resolveNativeCreativeResourceUpdateStatuses(references: readonly PublishedNativeCreativeResourceRef[]): Promise<Map<string, ResolvedNativeCreativeResourceUpdateStatus>>;
//# sourceMappingURL=native-resource-capture.d.ts.map