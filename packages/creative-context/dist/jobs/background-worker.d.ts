import type { ContextJob } from "../types.js";
export interface CreativeContextBackgroundDispatch {
    jobId: string;
    ownerEmail: string;
    orgId: string | null;
    appId: string;
    resumeAt?: string | null;
}
export type CreativeContextBackgroundDispatcher = (input: CreativeContextBackgroundDispatch) => Promise<void>;
export declare function registerCreativeContextBackgroundDispatcher(dispatcher: CreativeContextBackgroundDispatcher): () => void;
export declare function processDueCreativeContextBackgroundJobs(input: {
    appId: string;
    limit?: number;
}): Promise<{
    discovered: number;
    dispatched: number;
    failed: number;
}>;
export declare function enqueueCreativeContextDailyMaintenance(input: {
    appId: string;
    now?: number;
    limit?: number;
}): Promise<{
    discovered: number;
    queued: number;
    failed: number;
}>;
export declare function processCreativeContextBackgroundJob(input: CreativeContextBackgroundDispatch & {
    workerId?: string;
}): Promise<ContextJob>;
//# sourceMappingURL=background-worker.d.ts.map