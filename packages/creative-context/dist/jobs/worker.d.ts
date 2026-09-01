import type { ContextImportJobPersistence, RunContextImportJobOptions, RunContextImportJobResult } from "./types.js";
export interface CreativeContextImportDispatch {
    jobId: string;
    ownerEmail: string;
    orgId: string | null;
    appId: string;
    resumeAt?: string | null;
}
export type CreativeContextImportContinuationDispatcher = (input: CreativeContextImportDispatch) => Promise<void>;
export interface ProcessCreativeContextImportJobOptions extends CreativeContextImportDispatch {
    workerId?: string;
    persistence?: ContextImportJobPersistence;
    limits?: RunContextImportJobOptions["limits"];
    dispatchContinuation?: CreativeContextImportContinuationDispatcher;
}
export declare function registerCreativeContextImportContinuationDispatcher(dispatcher: CreativeContextImportContinuationDispatcher): () => void;
export declare function dispatchCreativeContextImportJob(input: CreativeContextImportDispatch): Promise<void>;
export declare function processDueCreativeContextImportJobs(input: {
    appId: string;
    limit?: number;
}): Promise<{
    discovered: number;
    dispatched: number;
    failed: number;
}>;
export declare function processCreativeContextImportJob(options: ProcessCreativeContextImportJobOptions): Promise<RunContextImportJobResult>;
//# sourceMappingURL=worker.d.ts.map