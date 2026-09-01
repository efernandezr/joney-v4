import type { ContextConnectorExecutionContext, ContextConnectorFetchRequest, ContextConnectorFetchResult, ContextConnectorInventoryPage, ContextConnectorInventoryRequest, ContextImportConnector } from "./types.js";
export declare class ManualContextConnector implements ContextImportConnector {
    readonly kind: "manual";
    readonly label = "Manual text";
    readonly supportsIncremental = false;
    inventory(request: ContextConnectorInventoryRequest, _context: ContextConnectorExecutionContext): Promise<ContextConnectorInventoryPage>;
    fetch(request: ContextConnectorFetchRequest, _context: ContextConnectorExecutionContext): Promise<ContextConnectorFetchResult>;
}
//# sourceMappingURL=manual.d.ts.map