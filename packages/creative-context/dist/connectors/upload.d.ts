import type { ContextConnectorExecutionContext, ContextConnectorFetchRequest, ContextConnectorFetchResult, ContextConnectorInventoryPage, ContextConnectorInventoryRequest, ContextImportConnector } from "./types.js";
export declare class UploadContextConnector implements ContextImportConnector {
    readonly kind: "upload";
    readonly label = "Uploaded files";
    readonly supportsIncremental = false;
    inventory(request: ContextConnectorInventoryRequest, _context: ContextConnectorExecutionContext): Promise<ContextConnectorInventoryPage>;
    fetch(request: ContextConnectorFetchRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorFetchResult>;
}
//# sourceMappingURL=upload.d.ts.map