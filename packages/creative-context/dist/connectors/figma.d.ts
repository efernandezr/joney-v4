import type { ContextConnectorExecutionContext, ContextConnectorFetchRequest, ContextConnectorFetchResult, ContextConnectorInventoryPage, ContextConnectorInventoryRequest, ContextImportConnector } from "./types.js";
export declare class FigmaContextConnector implements ContextImportConnector {
    readonly kind: "figma";
    readonly label = "Figma";
    readonly supportsIncremental = true;
    inventory(request: ContextConnectorInventoryRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorInventoryPage>;
    fetch(request: ContextConnectorFetchRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorFetchResult>;
}
export declare function figmaRecommendedFileKeys(config: Record<string, unknown>): string[];
//# sourceMappingURL=figma.d.ts.map