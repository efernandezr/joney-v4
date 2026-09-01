import type { ContextConnectorExecutionContext, ContextConnectorFetchRequest, ContextConnectorFetchResult, ContextConnectorInventoryItem, ContextConnectorInventoryPage, ContextConnectorInventoryRequest, ContextImportConnector } from "./types.js";
export declare const GOOGLE_SLIDES_CONTEXT_OAUTH_SCOPES: readonly ["https://www.googleapis.com/auth/drive.file"];
export declare class GoogleSlidesContextConnector implements ContextImportConnector {
    readonly kind: "google-slides";
    readonly label = "Google Slides";
    readonly supportsIncremental = true;
    verifiesContainerOwner(input: {
        config: Record<string, unknown>;
        inventory: ContextConnectorInventoryItem[];
    }): boolean;
    inventory(request: ContextConnectorInventoryRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorInventoryPage>;
    fetch(request: ContextConnectorFetchRequest, context: ContextConnectorExecutionContext): Promise<ContextConnectorFetchResult>;
}
export declare function googleSlidesRecommendedPresentationIds(config: Record<string, unknown>): string[];
//# sourceMappingURL=google-slides.d.ts.map