import type { BrandKitData } from "@agent-native/core/brand-kit";
import type { WebsiteDesignTokens } from "@agent-native/core/ingestion";
import { type RenderedPageProvider, type RenderedPageRequest, type RenderedPageResult } from "./rendered-page.js";
export type RenderedDesignExtractionStatus = "complete" | "partial" | "failed";
export interface RenderedDesignExtraction {
    status: RenderedDesignExtractionStatus;
    url: string;
    finalUrl?: string;
    title?: string;
    rendered: boolean;
    method?: RenderedPageResult["method"];
    confidence?: number;
    designTokens?: WebsiteDesignTokens;
    designMd?: string;
    brandKit?: BrandKitData;
    /** Back-compat projections for callers that consumed the old URL action. */
    pageTitle?: string;
    cssCustomProperties?: Record<string, string>;
    colors?: string[];
    fonts?: string[];
    fontFaces?: Array<{
        family: string;
        weight?: string;
    }>;
    googleFonts?: string[];
    stylesheetUrls?: string[];
    assets?: RenderedPageResult["extraction"]["assets"];
    screenshotEvidence?: Array<{
        viewport: "desktop" | "mobile";
        width: number;
        height: number;
        bytes: number;
    }>;
    warnings: string[];
    diagnostics: string[];
    error?: string;
}
export interface ExtractRenderedDesignOptions extends Pick<RenderedPageRequest, "timeoutMs" | "preferHosted"> {
    provider?: RenderedPageProvider;
}
/**
 * Extract a bounded visual language from a public website. Browser rendering
 * is deliberately delegated to the layered provider so this works with
 * Builder Browser, local Playwright, an approved attached browser, or the
 * existing SSRF-safe static fallback without changing app code.
 */
export declare function extractRenderedDesignSystemFromUrl(websiteUrl: string, options?: ExtractRenderedDesignOptions): Promise<RenderedDesignExtraction>;
/** Convert the shared browser result into the Assets style-brief vocabulary. */
export declare function styleBriefFromRenderedDesign(extraction: RenderedDesignExtraction): Record<string, unknown>;
export declare function brandKitDataFromExtraction(input: {
    url: string;
    finalUrl?: string;
    title?: string;
    designTokens: WebsiteDesignTokens;
    designMd: string;
    assets?: RenderedPageResult["extraction"]["assets"];
}): BrandKitData;
export declare function buildDesignMarkdown(input: {
    url: string;
    finalUrl: string;
    title: string;
    rendered: boolean;
    method: RenderedPageResult["method"];
    confidence: number;
    designTokens: WebsiteDesignTokens;
    warnings: string[];
}): string;
//# sourceMappingURL=rendered-design.d.ts.map