import { type NitroPluginDef } from "@agent-native/core/server";
import type { ContextConnectorExecutionContext } from "../connectors/types.js";
import { type CreativeContextImportContinuationDispatcher } from "../jobs/index.js";
import { type CreativeContextServerContext } from "./context.js";
export interface CreativeContextSetupOptions extends Partial<Omit<CreativeContextServerContext, "connectorContext">> {
    appId?: string;
    connectorContext?: Partial<ContextConnectorExecutionContext>;
    continuationDispatcher?: CreativeContextImportContinuationDispatcher;
}
declare const creativeContextDbPlugin: (nitroApp: any) => void | Promise<void>;
export declare function setupCreativeContext(options?: CreativeContextSetupOptions): NitroPluginDef;
export { creativeContextDbPlugin };
export * from "./brand-context.js";
export * from "./context.js";
export * from "./generation-context.js";
export * from "./enrichment.js";
export * from "./prompt-provider.js";
export * from "./retrieval.js";
export * from "../untrusted-reference.js";
export * from "./media.js";
export * from "./native-resource-capture.js";
export * from "./safe-native-preview.js";
export { brandKitDataFromExtraction, buildDesignMarkdown, extractRenderedDesignSystemFromUrl, styleBriefFromRenderedDesign, type ExtractRenderedDesignOptions, type RenderedDesignExtraction, type RenderedDesignExtractionStatus, } from "../connectors/rendered-design.js";
export { serializePrivateBlobHandle } from "../connectors/private-artifacts.js";
export { resolveNativeContextCloneReference } from "../store/contexts.js";
export { CREATIVE_CONTEXT_BACKGROUND_PROCESSOR_ROUTE, CREATIVE_CONTEXT_IMPORT_PROCESSOR_ROUTE, createCreativeContextWorkerPlugin, } from "../jobs/index.js";
//# sourceMappingURL=index.d.ts.map