import { FigmaContextConnector } from "./figma.js";
import { GoogleSlidesContextConnector } from "./google-slides.js";
import { ManualContextConnector } from "./manual.js";
import { NotionContextConnector } from "./notion.js";
import { ContextImportConnectorRegistry } from "./registry.js";
import { UploadContextConnector } from "./upload.js";
import { WebsiteContextConnector } from "./website.js";
const DEFAULT_CONNECTORS = [
    new ManualContextConnector(),
    new UploadContextConnector(),
    new GoogleSlidesContextConnector(),
    new FigmaContextConnector(),
    new NotionContextConnector(),
    new WebsiteContextConnector(),
];
const defaultCreativeContextConnectorRegistry = new ContextImportConnectorRegistry();
export function registerDefaultCreativeContextConnectors(registry = defaultCreativeContextConnectorRegistry) {
    for (const connector of DEFAULT_CONNECTORS) {
        if (!registry.has(connector.kind))
            registry.register(connector);
    }
    return registry;
}
export function getCreativeContextConnectorRegistry() {
    return registerDefaultCreativeContextConnectors();
}
export function createDefaultContextImportConnectorRegistry() {
    return registerDefaultCreativeContextConnectors(new ContextImportConnectorRegistry());
}
export { createDefaultContextConnectorExecutionContext, createWorkspaceConnectionResolver, } from "./context.js";
export { FigmaContextConnector, figmaRecommendedFileKeys } from "./figma.js";
export { fetchFigmaNativeContextItems, MAX_INLINE_NATIVE_CODE_BYTES, nativeFidelityReportFromEntries, } from "./figma-native.js";
export { GOOGLE_SLIDES_CONTEXT_OAUTH_SCOPES, GoogleSlidesContextConnector, googleSlidesRecommendedPresentationIds, } from "./google-slides.js";
export { compileGoogleSlidesPresentation, } from "./google-slides-native.js";
export { ManualContextConnector } from "./manual.js";
export { NotionContextConnector, notionRecommendedRootPageIds, } from "./notion.js";
export { parseUploadedDocument, } from "./document-parser.js";
export { ContextImportConnectorRegistry } from "./registry.js";
export { LayeredRenderedPageProvider, } from "./rendered-page.js";
export { brandKitDataFromExtraction, buildDesignMarkdown, extractRenderedDesignSystemFromUrl, styleBriefFromRenderedDesign, } from "./rendered-design.js";
export { recommendContextRoots, } from "./recommendations.js";
export { smartDefaultExternalIds } from "./smart-defaults.js";
export { UploadContextConnector } from "./upload.js";
export { WebsiteContextConnector } from "./website.js";
//# sourceMappingURL=index.js.map