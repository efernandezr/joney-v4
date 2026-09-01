import type { ContextImportMode, ContextJob, ContextJobKind, ContextJobStatus } from "../types.js";
export declare function createJob(input: {
    sourceId?: string;
    kind: ContextJobKind;
    mode?: ContextImportMode;
    request?: Record<string, unknown>;
    progressTotal?: number;
    budget?: Record<string, unknown>;
    dedupeKey?: string;
}): Promise<ContextJob>;
export declare function createDailyMaintenanceJob(input: {
    sourceId: string;
    scheduledAt: string;
}): Promise<{
    job: ContextJob;
    created: boolean;
}>;
export declare function enqueueContextRebuildJob(input: {
    sourceId: string;
    operation: "rebuild-fts" | "rebuild-embeddings";
    itemIds: string[];
}): Promise<ContextJob>;
export declare function getJob(jobId: string): Promise<ContextJob | null>;
export declare function listDueContextImportJobDispatches(input: {
    appId: string;
    now?: string;
    limit?: number;
}): Promise<Array<{
    jobId: string;
    ownerEmail: string;
    orgId: string | null;
    appId: string;
    resumeAt: string | null;
}>>;
export declare function listDueContextBackgroundJobDispatches(input: {
    appId: string;
    now?: string;
    limit?: number;
}): Promise<Array<{
    jobId: string;
    ownerEmail: string;
    orgId: string | null;
    appId: string;
    resumeAt: string | null;
}>>;
export interface JobPatch {
    status?: ContextJobStatus;
    progressCurrent?: number;
    progressTotal?: number | null;
    checkpoint?: Record<string, unknown> | null;
    result?: Record<string, unknown> | null;
    error?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    nextResumeAt?: string | null;
    budget?: Record<string, unknown> | null;
}
export declare function updateJob(jobId: string, patch: JobPatch): Promise<ContextJob>;
export declare function claimJobLease(input: {
    jobId: string;
    owner: string;
    token: string;
    expiresAt: string;
}): Promise<ContextJob | null>;
export declare function renewJobLease(input: {
    jobId: string;
    token: string;
    expiresAt: string;
}): Promise<boolean>;
export declare function continueJob(jobId: string): Promise<ContextJob>;
export declare function releaseJobLease(input: {
    jobId: string;
    token: string;
}): Promise<boolean>;
export declare function updateLeasedJob(input: {
    jobId: string;
    leaseToken: string;
    patch: JobPatch;
}): Promise<ContextJob | null>;
//# sourceMappingURL=jobs.d.ts.map