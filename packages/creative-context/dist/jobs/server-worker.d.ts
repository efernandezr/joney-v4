import { type NitroPluginDef } from "@agent-native/core/server";
export declare const CREATIVE_CONTEXT_IMPORT_PROCESSOR_ROUTE = "/_agent-native/creative-context/process-import";
export declare const CREATIVE_CONTEXT_BACKGROUND_PROCESSOR_ROUTE = "/_agent-native/creative-context/process-background";
export declare function createCreativeContextWorkerPlugin(input: {
    appId: string;
    registerDispatcher?: boolean;
}): NitroPluginDef;
export declare function startCreativeContextDailyMaintenance(input: {
    appId: string;
    intervalMs?: number;
}): () => void;
export declare function startCreativeContextImportSweep(input: {
    appId: string;
    intervalMs?: number;
}): () => void;
//# sourceMappingURL=server-worker.d.ts.map