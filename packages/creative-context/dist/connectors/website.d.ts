import { ssrfSafeFetch } from "@agent-native/core/extensions/url-safety";
import type { ContextConnectorExecutionContext, ContextConnectorFetchRequest, ContextConnectorFetchResult, ContextConnectorInventoryPage, ContextConnectorInventoryRequest, ContextImportConnector } from "./types.js";
export interface WebsiteReference {
    url: string;
    title: string;
}
export declare class WebsiteContextConnector implements ContextImportConnector {
    #private;
    readonly kind: "website";
    readonly label = "Websites";
    readonly supportsIncremental = true;
    inventory(request: ContextConnectorInventoryRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorInventoryPage>;
    fetch(request: ContextConnectorFetchRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorFetchResult>;
}
export declare function discoverWebsiteInventory(config: Record<string, unknown>, signal?: AbortSignal, fetcher?: typeof ssrfSafeFetch): Promise<{
    references: WebsiteReference[];
    inspected: number;
    truncated: boolean;
}>;
//# sourceMappingURL=website.d.ts.map