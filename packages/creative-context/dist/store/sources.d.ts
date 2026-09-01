import type { WorkspaceConnectionLifecycleEvent } from "@agent-native/core/workspace-connections";
import type { ContextSource, ContextSourceStatus, ContextSourceHealth, ContextSourceSummary, ContextSourcePromotionPreview, UpstreamAccess } from "../types.js";
export declare function toSourceSummary(source: ContextSource): ContextSourceSummary;
export declare function initialContextSourceHealth(kind: string, connectionId?: string): ContextSourceHealth;
export declare function listContextSources(input: {
    status?: ContextSourceStatus;
    healthStatus?: ContextSourceHealth;
    kind?: string;
    limit: number;
    cursor?: string;
}): Promise<{
    sources: ContextSourceSummary[];
    nextCursor?: string;
}>;
export declare function getContextSource(sourceId: string): Promise<ContextSource | null>;
export declare function handleWorkspaceConnectionLifecycle(event: WorkspaceConnectionLifecycleEvent): Promise<{
    sources: number;
    jobs: number;
}>;
export declare function listContextSourcesDueForMaintenance(input: {
    before: string;
    limit?: number;
}): Promise<Array<{
    sourceId: string;
    ownerEmail: string;
    orgId: string | null;
}>>;
export declare function createContextSource(input: {
    name: string;
    kind: string;
    externalRef?: string;
    connectionId?: string;
    config?: Record<string, unknown>;
    upstreamAccess?: UpstreamAccess;
}): Promise<ContextSource>;
export declare function updateContextSource(sourceId: string, patch: {
    name?: string;
    externalRef?: string | null;
    connectionId?: string | null;
    config?: Record<string, unknown>;
    upstreamAccess?: UpstreamAccess;
    status?: ContextSourceStatus;
    healthStatus?: ContextSourceHealth;
    syncCursor?: string | null;
    itemCount?: number;
    lastSyncedAt?: string | null;
    lastError?: string | null;
}): Promise<ContextSource>;
export declare function archiveContextSource(sourceId: string): Promise<ContextSource>;
export declare function restoreContextSource(sourceId: string): Promise<ContextSource>;
export declare function promoteContextSource(sourceId: string, confirmation: {
    containerRef: string;
    boundaryHash: string;
    itemCount: number;
}): Promise<ContextSource>;
export declare function assertContextSourcePromotionConfirmation(preview: Pick<ContextSourcePromotionPreview, "containerRef" | "boundaryHash" | "itemCount">, confirmation: {
    containerRef: string;
    boundaryHash: string;
    itemCount: number;
}): void;
export declare function contextSourceBoundary(input: {
    kind: string;
    externalRef: string | null;
    config: Record<string, unknown>;
}): Promise<{
    summary: string;
    hash: string;
    selected: Record<string, unknown>;
}>;
export declare function previewContextSourcePromotion(sourceId: string): Promise<ContextSourcePromotionPreview>;
export declare function markSourceContainerOwnerVerified(sourceId: string): Promise<void>;
export declare function deleteContextSource(sourceId: string): Promise<{
    source: ContextSource;
    purgeJobId: string;
}>;
//# sourceMappingURL=sources.d.ts.map