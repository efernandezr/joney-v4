import { ssrfSafeFetch } from "@agent-native/core/extensions/url-safety";
import { type WebsiteExtraction } from "@agent-native/core/ingestion";
export type RenderedPageMethod = "builder-browser" | "local-playwright" | "attached-chrome" | "static-html";
export interface RenderedPageRequest {
    url: string;
    timeoutMs?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle";
    preferHosted?: boolean;
}
export interface RenderedPageResult {
    url: string;
    finalUrl: string;
    title: string;
    text: string;
    method: RenderedPageMethod;
    rendered: boolean;
    warnings: string[];
    extraction: WebsiteExtraction;
    screenshots: Array<{
        viewport: "desktop" | "mobile";
        width: number;
        height: number;
        data: Uint8Array;
    }>;
    confidence: number;
    classification: "homepage" | "marketing" | "documentation" | "content" | "unknown";
    diagnostics: string[];
    metadata: Record<string, unknown>;
}
export interface RenderedPageProvider {
    render(request: RenderedPageRequest): Promise<RenderedPageResult>;
}
interface PlaywrightRequestLike {
    url(): string;
    isNavigationRequest(): boolean;
    resourceType(): string;
    method?(): string;
    headers?(): Record<string, string>;
}
interface PlaywrightRouteLike {
    request(): PlaywrightRequestLike;
    continue(): Promise<void>;
    abort(errorCode?: string): Promise<void>;
    fulfill(options: {
        status: number;
        headers: Record<string, string>;
        body: Uint8Array;
    }): Promise<void>;
}
interface PlaywrightPageLike {
    route(pattern: string, handler: (route: PlaywrightRouteLike) => Promise<void>): Promise<void>;
    goto(url: string, options: {
        timeout: number;
        waitUntil: string;
    }): Promise<unknown>;
    waitForLoadState?(state: "load" | "domcontentloaded" | "networkidle", options?: {
        timeout: number;
    }): Promise<void>;
    title(): Promise<string>;
    url(): string;
    locator(selector: string): {
        innerText(): Promise<string>;
    };
    setViewportSize(size: {
        width: number;
        height: number;
    }): Promise<void>;
    screenshot(options: {
        type: "png";
        fullPage: boolean;
    }): Promise<Uint8Array>;
    evaluate<T>(callback: string | (() => T)): Promise<T>;
}
interface PlaywrightContextLike {
    pages(): PlaywrightPageLike[];
    newPage(): Promise<PlaywrightPageLike>;
    close?(): Promise<void>;
}
interface PlaywrightBrowserLike {
    contexts(): PlaywrightContextLike[];
    newContext?(): Promise<PlaywrightContextLike>;
    close(): Promise<void>;
}
interface PlaywrightLike {
    chromium: {
        connectOverCDP(endpoint: string): Promise<PlaywrightBrowserLike>;
        launch(options: {
            headless: boolean;
            args?: string[];
            executablePath?: string;
        }): Promise<PlaywrightBrowserLike>;
    };
}
export interface LayeredRenderedPageProviderOptions {
    requestBuilderBrowserConnection?: (input: {
        sessionId: string;
    }) => Promise<Record<string, unknown>>;
    loadPlaywright?: () => Promise<PlaywrightLike | null>;
    requestAttachedBrowserConnection?: (input: {
        sessionId: string;
        url: string;
    }) => Promise<{
        wsUrl: string;
    }>;
    staticFetch?: typeof ssrfSafeFetch;
}
export declare class LayeredRenderedPageProvider implements RenderedPageProvider {
    #private;
    constructor(options?: LayeredRenderedPageProviderOptions);
    render(request: RenderedPageRequest): Promise<RenderedPageResult>;
}
export declare function renderWithPlaywright(playwright: PlaywrightLike, request: RenderedPageRequest, warnings: string[], method: "builder-browser" | "local-playwright" | "attached-chrome", wsUrl?: string): Promise<RenderedPageResult>;
/** The one resolver for this key. */
export declare function chromiumPackUrl(architecture?: NodeJS.Architecture): string;
export declare function boundWebsiteExtraction(extraction: WebsiteExtraction): WebsiteExtraction;
export {};
//# sourceMappingURL=rendered-page.d.ts.map