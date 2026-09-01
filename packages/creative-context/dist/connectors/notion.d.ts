import type { ContextConnectorExecutionContext, ContextConnectorFetchRequest, ContextConnectorFetchResult, ContextConnectorInventoryPage, ContextConnectorInventoryRequest, ContextImportConnector } from "./types.js";
export declare class NotionContextConnector implements ContextImportConnector {
    readonly kind: "notion";
    readonly label = "Notion";
    readonly supportsIncremental = true;
    inventory(request: ContextConnectorInventoryRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorInventoryPage>;
    fetch(request: ContextConnectorFetchRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorFetchResult>;
}
export declare function notionRecommendedRootPageIds(config: Record<string, unknown>): string[];
//# sourceMappingURL=notion.d.ts.map