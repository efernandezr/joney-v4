import { runWithRequestContext } from "@agent-native/core/server";
import { getCreativeContext } from "../server/context.js";
import { getContextSource, listDueContextImportJobDispatches, } from "../store/index.js";
import { runContextImportJob } from "./import-runner.js";
import { creativeContextImportJobPersistence } from "./store-adapter.js";
let configuredDispatcher = null;
export function registerCreativeContextImportContinuationDispatcher(dispatcher) {
    configuredDispatcher = dispatcher;
    return () => {
        if (configuredDispatcher === dispatcher)
            configuredDispatcher = null;
    };
}
export async function dispatchCreativeContextImportJob(input) {
    const dispatcher = configuredDispatcher ?? localContinuationDispatcher;
    await dispatcher(input);
}
export async function processDueCreativeContextImportJobs(input) {
    const due = await listDueContextImportJobDispatches(input);
    let dispatched = 0;
    let failed = 0;
    for (const job of due) {
        try {
            await dispatchCreativeContextImportJob(job);
            dispatched++;
        }
        catch (error) {
            failed++;
            console.error(`[creative-context] failed to dispatch due import ${job.jobId}:`, error instanceof Error ? error.message : error);
        }
    }
    return { discovered: due.length, dispatched, failed };
}
export async function processCreativeContextImportJob(options) {
    return runWithRequestContext({
        userEmail: options.ownerEmail,
        ...(options.orgId ? { orgId: options.orgId } : {}),
    }, async () => {
        const configured = getCreativeContext();
        const source = await getContextSourceForJob(options.jobId, options.persistence ?? creativeContextImportJobPersistence);
        const result = await runContextImportJob({
            jobId: options.jobId,
            source,
            workerId: options.workerId ??
                `creative-context:${process.pid}:${Math.random().toString(36).slice(2)}`,
            persistence: options.persistence ?? creativeContextImportJobPersistence,
            connectors: configured.connectors,
            connectorContext: {
                ...configured.connectorContext,
                appId: configured.connectorContext.appId || options.appId,
                ownerEmail: configured.connectorContext.ownerEmail ?? options.ownerEmail,
            },
            limits: options.limits,
        });
        if (result.yielded && result.reason !== "lease") {
            await (options.dispatchContinuation ??
                configuredDispatcher ??
                localContinuationDispatcher)({
                jobId: options.jobId,
                ownerEmail: options.ownerEmail,
                orgId: options.orgId,
                appId: options.appId,
                resumeAt: result.job.nextResumeAt,
            });
        }
        return result;
    });
}
async function getContextSourceForJob(jobId, persistence) {
    const job = await persistence.getJob(jobId);
    if (!job?.sourceId)
        throw new Error("Creative context import job has no source.");
    const source = await getContextSource(job.sourceId);
    if (!source)
        throw new Error("Creative context source was not found.");
    return source;
}
async function localContinuationDispatcher(input) {
    const resumeAt = input.resumeAt
        ? new Date(input.resumeAt).getTime()
        : Date.now();
    const delay = Math.max(0, Math.min(2_147_000_000, resumeAt - Date.now()));
    const timer = setTimeout(() => {
        void processCreativeContextImportJob(input).catch((error) => {
            console.error("[creative-context] local import continuation failed:", error instanceof Error ? error.message : error);
        });
    }, delay);
    timer.unref?.();
}
//# sourceMappingURL=worker.js.map