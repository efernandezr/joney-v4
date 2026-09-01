import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { isBlockedExtensionUrlWithDns, ssrfSafeFetch, } from "@agent-native/core/extensions/url-safety";
import { extractStaticWebsiteContext, rankColorSamples, readBoundedResponseBytes, } from "@agent-native/core/ingestion";
import { normalizeWhitespace } from "./normalize.js";
const MAX_RENDERED_TEXT_CHARS = 2_000_000;
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const MAX_STATIC_HTML_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTED_ASSETS = 500;
const MAX_INTERNAL_LINKS = 500;
const MAX_COLORS = 256;
const MAX_TYPOGRAPHY = 100;
const MAX_SPACING = 100;
const MAX_RADII = 64;
const MAX_CSS_VARIABLES = 128;
const MAX_COMPONENT_STYLES = 24;
const FONT_READY_TIMEOUT_MS = 4_000;
const MAX_BROWSER_RESOURCE_BYTES = 12 * 1024 * 1024;
const MAX_BROWSER_RESOURCE_COUNT = 400;
const MAX_BROWSER_RESOURCE_BYTES_TOTAL = 64 * 1024 * 1024;
const BROWSER_RESOURCE_TIMEOUT_MS = 15_000;
const BROWSER_REQUEST_HEADERS = new Set([
    "accept",
    "accept-language",
    "if-modified-since",
    "if-none-match",
    "origin",
    "range",
    "referer",
    "user-agent",
]);
const BROWSER_RESPONSE_HEADERS = new Set([
    "connection",
    "content-encoding",
    "content-length",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "set-cookie",
    "set-cookie2",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);
export class LayeredRenderedPageProvider {
    #requestBuilderBrowserConnection;
    #loadPlaywright;
    #requestAttachedBrowserConnection;
    #staticFetch;
    constructor(options = {}) {
        this.#requestBuilderBrowserConnection =
            options.requestBuilderBrowserConnection ?? defaultBuilderBrowserRequest;
        this.#loadPlaywright = options.loadPlaywright ?? loadOptionalPlaywright;
        this.#requestAttachedBrowserConnection =
            options.requestAttachedBrowserConnection;
        this.#staticFetch = options.staticFetch ?? ssrfSafeFetch;
    }
    async render(request) {
        await assertPublicBrowserUrl(request.url);
        const warnings = [];
        const playwright = await this.#loadPlaywright().catch((error) => {
            warnings.push(`Playwright unavailable: ${errorMessage(error)}`);
            return null;
        });
        if (request.preferHosted !== false && playwright) {
            try {
                const connection = await this.#requestBuilderBrowserConnection({
                    sessionId: `creative-context-${randomUUID()}`,
                });
                const wsUrl = typeof connection.wsUrl === "string" ? connection.wsUrl.trim() : "";
                if (!wsUrl)
                    throw new Error("Builder Browser did not return wsUrl.");
                return await renderWithPlaywright(playwright, request, warnings, "builder-browser", wsUrl);
            }
            catch (error) {
                warnings.push(`Builder Browser unavailable: ${errorMessage(error)}`);
            }
        }
        if (playwright) {
            try {
                return await renderWithPlaywright(playwright, request, warnings, "local-playwright");
            }
            catch (error) {
                warnings.push(`Local Playwright unavailable: ${errorMessage(error)}`);
            }
        }
        if (playwright && this.#requestAttachedBrowserConnection) {
            try {
                const connection = await this.#requestAttachedBrowserConnection({
                    sessionId: `creative-context-attached-${randomUUID()}`,
                    url: request.url,
                });
                if (!connection.wsUrl?.trim()) {
                    throw new Error("Approved attached browser did not return wsUrl.");
                }
                return await renderWithPlaywright(playwright, request, warnings, "attached-chrome", connection.wsUrl);
            }
            catch (error) {
                warnings.push(`Attached Chrome unavailable: ${errorMessage(error)}`);
            }
        }
        else {
            warnings.push("Attached Chrome unavailable: no approved browser connection adapter is configured.");
        }
        return renderStatic(request, warnings, this.#staticFetch);
    }
}
export async function renderWithPlaywright(playwright, request, warnings, method, wsUrl) {
    const browser = wsUrl
        ? await playwright.chromium.connectOverCDP(wsUrl)
        : await launchChromium(playwright.chromium);
    let isolatedContext;
    try {
        // Never reuse a connected browser's ambient context: it can carry cookies,
        // extensions, or tabs from another workflow. The safe proxy below is only
        // useful when the page itself is isolated from that state.
        if (!browser.newContext) {
            throw new Error("Browser did not provide isolated context support.");
        }
        isolatedContext = await browser.newContext();
        const page = await isolatedContext.newPage();
        const getFinalNavigationUrl = await installNavigationGuard(page, request, warnings);
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(request.url, {
            timeout: boundedTimeout(request.timeoutMs),
            waitUntil: request.waitUntil ?? "domcontentloaded",
        });
        await page
            .waitForLoadState?.("load", {
            timeout: Math.min(8_000, boundedTimeout(request.timeoutMs)),
        })
            .catch((error) => {
            warnings.push(`Browser load stabilization unavailable: ${errorMessage(error)}`);
        });
        // React hydration, CSS-in-JS insertion, and web fonts commonly finish just
        // after `load`. Give those layers a bounded chance to settle, then capture
        // the computed cascade rather than the server HTML.
        await page
            .waitForLoadState?.("networkidle", { timeout: 4_000 })
            .catch((error) => {
            warnings.push(`Browser network-idle stabilization unavailable: ${errorMessage(error)}`);
        });
        await waitForFontReadiness(page, Math.min(FONT_READY_TIMEOUT_MS, boundedTimeout(request.timeoutMs))).catch((error) => {
            warnings.push(`Browser font readiness unavailable: ${errorMessage(error)}`);
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
        await page.evaluate(dismissConsentOverlays).catch(() => undefined);
        const finalUrl = getFinalNavigationUrl() ?? page.url();
        await assertPublicBrowserUrl(finalUrl);
        const [title, text, desktopScreenshot, extraction] = await Promise.all([
            page.title().catch((error) => {
                warnings.push(`Browser title extraction unavailable: ${errorMessage(error)}`);
                return "";
            }),
            page
                .locator("body")
                .innerText()
                .catch((error) => {
                warnings.push(`Browser text extraction unavailable: ${errorMessage(error)}`);
                return "";
            }),
            page
                .screenshot({ type: "png", fullPage: false })
                .then(boundedScreenshot)
                .catch((error) => {
                warnings.push(`Desktop screenshot unavailable: ${errorMessage(error)}`);
                return undefined;
            }),
            page
                .evaluate(browserCaptureExpression())
                .catch((error) => {
                warnings.push(`Browser style extraction unavailable: ${errorMessage(error)}`);
                return emptyExtraction();
            }),
        ]);
        await page.setViewportSize({ width: 390, height: 844 });
        const mobileScreenshot = await page
            .screenshot({ type: "png", fullPage: false })
            .then(boundedScreenshot)
            .catch((error) => {
            warnings.push(`Mobile screenshot unavailable: ${errorMessage(error)}`);
            return undefined;
        });
        const unboundedText = normalizeWhitespace(text);
        const textTruncated = unboundedText.length > MAX_RENDERED_TEXT_CHARS;
        const normalizedText = unboundedText.slice(0, MAX_RENDERED_TEXT_CHARS);
        const resolvedExtraction = boundWebsiteExtraction({
            ...extraction,
            title: normalizeWhitespace(title) || extraction.title,
            text: normalizedText || extraction.text,
            designTokens: {
                ...extraction.designTokens,
                colors: rankColorSamples(extraction.designTokens.colors),
            },
        });
        const diagnostics = [
            ...warnings,
            `Captured ${resolvedExtraction.assets.length} assets and ${resolvedExtraction.internalLinks.length} same-origin links.`,
            ...(desktopScreenshot && mobileScreenshot
                ? []
                : ["One or more viewport screenshots could not be captured."]),
            ...(textTruncated
                ? [`Body text was truncated at ${MAX_RENDERED_TEXT_CHARS} characters.`]
                : []),
        ];
        return {
            url: request.url,
            finalUrl,
            title: normalizeWhitespace(title) || new URL(finalUrl).hostname,
            text: resolvedExtraction.text,
            method,
            rendered: true,
            warnings,
            extraction: resolvedExtraction,
            screenshots: [
                ...(desktopScreenshot
                    ? [
                        {
                            viewport: "desktop",
                            width: 1440,
                            height: 900,
                            data: desktopScreenshot,
                        },
                    ]
                    : []),
                ...(mobileScreenshot
                    ? [
                        {
                            viewport: "mobile",
                            width: 390,
                            height: 844,
                            data: mobileScreenshot,
                        },
                    ]
                    : []),
            ],
            confidence: 0.92,
            classification: classifyWebsite(resolvedExtraction, finalUrl),
            diagnostics,
            metadata: {
                browser: method,
                assetCount: resolvedExtraction.assets.length,
                internalLinkCount: resolvedExtraction.internalLinks.length,
            },
        };
    }
    finally {
        await isolatedContext?.close?.().catch((error) => {
            warnings.push(`Browser context cleanup unavailable: ${errorMessage(error)}`);
        });
        await browser.close().catch(() => undefined);
    }
}
async function waitForFontReadiness(page, timeoutMs) {
    let timeout;
    try {
        await Promise.race([
            page.evaluate(async () => {
                if (document.fonts?.ready)
                    await document.fonts.ready;
            }),
            new Promise((_, reject) => {
                timeout = setTimeout(() => {
                    reject(new Error(`font readiness timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            }),
        ]);
    }
    finally {
        if (timeout !== undefined)
            clearTimeout(timeout);
    }
}
async function installNavigationGuard(page, renderRequest, warnings) {
    let finalNavigationUrl;
    let resourceCount = 0;
    let resourceBytes = 0;
    let reservedResourceBytes = 0;
    const bodyBudgetWaiters = [];
    let resourceLimitWarningAdded = false;
    let blockedResourceWarningAdded = false;
    let failedResourceWarningAdded = false;
    const reserveBodyBudget = async () => {
        while (reservedResourceBytes + MAX_BROWSER_RESOURCE_BYTES >
            MAX_BROWSER_RESOURCE_BYTES_TOTAL) {
            await new Promise((resolve) => {
                bodyBudgetWaiters.push(resolve);
            });
        }
        reservedResourceBytes += MAX_BROWSER_RESOURCE_BYTES;
        let released = false;
        return () => {
            if (released)
                return;
            released = true;
            reservedResourceBytes -= MAX_BROWSER_RESOURCE_BYTES;
            bodyBudgetWaiters.shift()?.();
        };
    };
    const addWarning = (value) => {
        if (!warnings.includes(value))
            warnings.push(value);
    };
    await page.route("**/*", async (route) => {
        const browserRequest = route.request();
        let parsed;
        try {
            parsed = new URL(browserRequest.url());
        }
        catch {
            // coercion-ok: an absent optional package means the next compatible probe should run.
            await route.abort("blockedbyclient");
            return;
        }
        if (parsed.protocol === "about:" ||
            parsed.protocol === "data:" ||
            parsed.protocol === "blob:") {
            await route.continue();
            return;
        }
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            await route.abort("blockedbyclient");
            return;
        }
        const method = (browserRequest.method?.() ?? "GET").toUpperCase();
        if (method !== "GET" && method !== "HEAD") {
            await route.abort("blockedbyclient");
            if (!resourceLimitWarningAdded) {
                resourceLimitWarningAdded = true;
                addWarning("Browser blocked a non-read-only resource request during extraction.");
            }
            return;
        }
        if (resourceCount >= MAX_BROWSER_RESOURCE_COUNT) {
            await route.abort("blockedbyclient");
            if (!resourceLimitWarningAdded) {
                resourceLimitWarningAdded = true;
                addWarning(`Browser resource budget reached (${MAX_BROWSER_RESOURCE_COUNT} requests).`);
            }
            return;
        }
        // Reserve the request slot before the first await. Browser route handlers
        // overlap, so incrementing only after the proxy response arrives lets a
        // burst of requests all pass the limit check.
        resourceCount += 1;
        let bodyBudgetRelease;
        let committedBytes = 0;
        let fulfilled = false;
        try {
            await assertPublicBrowserUrl(parsed.href);
            const response = await ssrfSafeFetch(parsed.href, {
                method,
                headers: browserRequestHeaders(browserRequest),
                signal: AbortSignal.timeout(Math.min(BROWSER_RESOURCE_TIMEOUT_MS, boundedTimeout(renderRequest.timeoutMs))),
            }, { maxRedirects: 5 });
            bodyBudgetRelease = await reserveBodyBudget();
            const body = await readBoundedResponseBytes(response, MAX_BROWSER_RESOURCE_BYTES);
            bodyBudgetRelease();
            bodyBudgetRelease = undefined;
            if (resourceBytes + body.byteLength > MAX_BROWSER_RESOURCE_BYTES_TOTAL) {
                await route.abort("blockedbyclient");
                if (!resourceLimitWarningAdded) {
                    resourceLimitWarningAdded = true;
                    addWarning(`Browser resource budget reached (${MAX_BROWSER_RESOURCE_BYTES_TOTAL} bytes).`);
                }
                return;
            }
            resourceBytes += body.byteLength;
            committedBytes = body.byteLength;
            if (browserRequest.isNavigationRequest()) {
                finalNavigationUrl = response.url || parsed.href;
            }
            await route.fulfill({
                status: response.status,
                headers: browserResponseHeaders(response),
                body: Buffer.from(body),
            });
            fulfilled = true;
        }
        catch (error) {
            if (committedBytes > 0) {
                resourceBytes -= committedBytes;
                committedBytes = 0;
            }
            await route.abort("blockedbyclient");
            if (isSsrfError(error)) {
                if (!blockedResourceWarningAdded) {
                    blockedResourceWarningAdded = true;
                    addWarning("Some browser resources were blocked by the SSRF safety policy.");
                }
            }
            else if (!failedResourceWarningAdded) {
                failedResourceWarningAdded = true;
                addWarning("Some browser resources could not be fetched through the safe network proxy.");
            }
        }
        finally {
            bodyBudgetRelease?.();
            if (!fulfilled)
                resourceCount -= 1;
        }
    });
    return () => finalNavigationUrl;
}
function browserRequestHeaders(request) {
    const source = request.headers?.() ?? {};
    return Object.fromEntries(Object.entries(source).filter(([name, value]) => {
        return BROWSER_REQUEST_HEADERS.has(name.toLowerCase()) && Boolean(value);
    }));
}
function browserResponseHeaders(response) {
    const headers = {};
    response.headers.forEach((value, name) => {
        if (!BROWSER_RESPONSE_HEADERS.has(name.toLowerCase())) {
            headers[name] = value;
        }
    });
    return headers;
}
function isSsrfError(error) {
    return /ssrf blocked|private\/internal|connect blocked/i.test(errorMessage(error));
}
const SYSTEM_CHROME_EXECUTABLES = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
];
async function launchChromium(chromium) {
    const launchOptions = {
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
    };
    let missingBrowserError;
    try {
        return await chromium.launch(launchOptions);
    }
    catch (error) {
        if (!isMissingBrowserError(error))
            throw error;
        missingBrowserError = error;
    }
    const serverlessChromium = await loadOptionalServerlessChromium();
    if (serverlessChromium) {
        try {
            const executablePath = await serverlessChromium.executablePath(chromiumPackUrl());
            if (executablePath) {
                return await chromium.launch({
                    ...launchOptions,
                    args: [...launchOptions.args, ...(serverlessChromium.args ?? [])],
                    executablePath,
                });
            }
        }
        catch (error) {
            missingBrowserError = error;
        }
    }
    for (const executablePath of SYSTEM_CHROME_EXECUTABLES) {
        if (!existsSync(executablePath))
            continue;
        try {
            return await chromium.launch({ ...launchOptions, executablePath });
        }
        catch {
            continue;
        }
    }
    if (missingBrowserError) {
        throw missingBrowserError;
    }
    throw new Error("No Chromium executable is available for browser extraction.");
}
/**
 * Where the headless browser binary comes from.
 *
 * The full `@sparticuz/chromium` package carries a 66MB browser inside every
 * serverless function — paid on every cold start of every function, to serve a
 * fallback path most requests never take. `chromium-min` is 46KB and fetches
 * the same pinned pack on first launch instead, caching it in the container.
 *
 * Pinned to the version this package depends on: a pack built for a different
 * Chromium than the client expects fails at launch, so this must move in
 * lockstep with the dependency. Point AGENT_NATIVE_CHROMIUM_PACK_URL at your
 * own mirror to drop the runtime dependency on the upstream release.
 */
const CHROMIUM_PACK_VERSION = "149.0.0";
/** The one resolver for this key. */
export function chromiumPackUrl(architecture = process.arch) {
    const packArchitecture = architecture === "arm64" ? "arm64" : "x64";
    return (process.env.AGENT_NATIVE_CHROMIUM_PACK_URL?.trim() ||
        `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_PACK_VERSION}` +
            `/chromium-v${CHROMIUM_PACK_VERSION}-pack.${packArchitecture}.tar`);
}
async function loadOptionalServerlessChromium() {
    const specifier = "@sparticuz/chromium-min";
    try {
        const module = (await import(/* @vite-ignore */ specifier));
        const chromium = module.default ?? module;
        return typeof chromium.executablePath === "function"
            ? chromium
            : null;
    }
    catch {
        // coercion-ok: this optional capability is absent in non-serverless installs.
        return null;
    }
}
/*
 * Kept separate from Playwright loading so a deployment can omit the large
 * serverless Chromium package and still use Builder Browser or system Chrome.
 */
async function loadOptionalPlaywright() {
    for (const specifier of [
        "playwright",
        "@playwright/test",
        "playwright-core",
    ]) {
        try {
            const module = (await import(
            /* @vite-ignore */ specifier));
            for (const candidate of [module.default, module]) {
                if (typeof candidate?.chromium?.launch === "function") {
                    return candidate;
                }
            }
            // coercion-ok: an absent optional package means the next compatible probe should run.
        }
        catch {
            // Try the next compatible browser package before falling back to HTML.
        }
    }
    // coercion-ok: browser packages are optional in non-Node runtimes.
    return null;
}
async function defaultBuilderBrowserRequest(input) {
    const server = (await import("@agent-native/core/server"));
    if (!server.requestBuilderBrowserConnection) {
        throw new Error("@agent-native/core/server does not export requestBuilderBrowserConnection.");
    }
    return server.requestBuilderBrowserConnection(input);
}
function isMissingBrowserError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return /Executable doesn't exist|playwright install|browser.*not found|chromium.*not found/i.test(message);
}
/** Close common consent banners without accepting tracking or changing page data. */
function dismissConsentOverlays() {
    const selectors = [
        '[aria-label*="reject" i]',
        '[aria-label*="decline" i]',
        '[aria-label*="close" i]',
        '[data-testid*="reject" i]',
        '[data-testid*="decline" i]',
        '[data-testid*="close" i]',
        'button[id*="reject" i]',
        'button[id*="decline" i]',
        'button[class*="reject" i]',
        'button[class*="decline" i]',
    ];
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element)
            continue;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none") {
            element.click();
            return;
        }
    }
}
async function renderStatic(request, warnings, fetcher) {
    const response = await fetcher(request.url, {
        headers: {
            Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
        },
        signal: AbortSignal.timeout(boundedTimeout(request.timeoutMs)),
    }, { maxRedirects: 5 });
    if (!response.ok) {
        throw new Error(`Static page fetch failed (${response.status}).`);
    }
    const html = new TextDecoder().decode(await readBoundedResponseBytes(response, MAX_STATIC_HTML_BYTES));
    const finalUrl = response.url || request.url;
    const extraction = extractStaticWebsiteContext(html, finalUrl);
    const title = extraction.title || new URL(finalUrl).hostname;
    warnings.push("Used the SSRF-safe static HTML fallback; client-rendered content may be missing.");
    return {
        url: request.url,
        finalUrl,
        title,
        text: extraction.text,
        method: "static-html",
        rendered: false,
        warnings,
        extraction: { ...extraction, title },
        screenshots: [],
        confidence: 0.45,
        classification: classifyWebsite(extraction, finalUrl),
        diagnostics: [
            ...warnings,
            "Static extraction cannot verify client-rendered layout or viewport behavior.",
        ],
        metadata: {
            contentType: response.headers.get("content-type"),
            etag: response.headers.get("etag"),
            lastModified: response.headers.get("last-modified"),
            staticFallback: true,
            assetCount: extraction.assets.length,
            internalLinkCount: extraction.internalLinks.length,
        },
    };
}
async function assertPublicBrowserUrl(value) {
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new Error("Website URL must be an absolute http(s) URL.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Website URL must use http or https.");
    }
    if (parsed.username || parsed.password) {
        throw new Error("Website URLs cannot contain credentials.");
    }
    if (await isBlockedExtensionUrlWithDns(parsed.href)) {
        throw new Error("SSRF blocked: website resolved to a private/internal host.");
    }
}
function captureRenderedWebsiteContext() {
    const MAX_ASSETS = 500;
    const MAX_LINKS = 500;
    const MAX_COLOR_VALUES = 256;
    const MAX_TYPE_STYLES = 100;
    const MAX_SPACING_VALUES = 100;
    const MAX_RADIUS_VALUES = 64;
    const MAX_SHADOWS = 32;
    const MAX_BACKGROUNDS = 32;
    const MAX_VARIABLES = 128;
    const MAX_TEXT = 2_000_000;
    const MAX_COMPONENT_STYLES = 24;
    const assets = new Map();
    const links = new Set();
    const colors = [];
    const typography = new Map();
    const spacing = new Set();
    const radii = new Set();
    const shadows = new Set();
    const backgrounds = new Set();
    const components = [];
    const cssVariables = {};
    const semanticColors = {};
    function isOpaque(value) {
        const normalized = value.trim().toLowerCase();
        if (!normalized || normalized === "transparent")
            return false;
        const functionBody = normalized.match(/^[a-z-]+\((.*)\)$/)?.[1];
        if (!functionBody)
            return true;
        const alphaValue = functionBody.includes("/")
            ? functionBody.split("/").at(-1)?.trim()
            : functionBody.split(",").length === 4
                ? functionBody.split(",").at(-1)?.trim()
                : undefined;
        if (!alphaValue)
            return true;
        const alpha = alphaValue.endsWith("%")
            ? Number.parseFloat(alphaValue) / 100
            : Number.parseFloat(alphaValue);
        return Number.isNaN(alpha) || alpha > 0.02;
    }
    function addColor(value) {
        if (colors.length >= MAX_COLOR_VALUES || !isOpaque(value))
            return;
        const normalized = value.trim();
        if (!colors.includes(normalized))
            colors.push(normalized);
    }
    function visible(element) {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity || 1) > 0.02);
    }
    function firstVisible(selector) {
        return Array.from(document.querySelectorAll(selector)).find(visible);
    }
    function opaqueValue(value) {
        return isOpaque(value) ? value.trim() : undefined;
    }
    function recordComputedStyle(element, role) {
        const style = getComputedStyle(element);
        const values = [
            style.color,
            style.backgroundColor,
            style.borderTopColor,
            style.borderRightColor,
            style.borderBottomColor,
            style.borderLeftColor,
        ];
        values.forEach(addColor);
        if (style.boxShadow && style.boxShadow !== "none") {
            if (shadows.size < MAX_SHADOWS)
                shadows.add(style.boxShadow);
        }
        if (style.backgroundImage && style.backgroundImage !== "none") {
            if (backgrounds.size < MAX_BACKGROUNDS) {
                backgrounds.add(style.backgroundImage);
            }
        }
        for (const value of [
            style.marginTop,
            style.marginRight,
            style.marginBottom,
            style.marginLeft,
            style.paddingTop,
            style.paddingRight,
            style.paddingBottom,
            style.paddingLeft,
            style.gap,
            style.rowGap,
            style.columnGap,
        ]) {
            if (spacing.size < MAX_SPACING_VALUES &&
                value &&
                value !== "0px" &&
                value !== "normal") {
                spacing.add(value);
            }
        }
        for (const value of [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomRightRadius,
            style.borderBottomLeftRadius,
        ]) {
            if (radii.size < MAX_RADIUS_VALUES && value && value !== "0px") {
                radii.add(value);
            }
        }
        const type = {
            family: style.fontFamily,
            size: style.fontSize,
            weight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
        };
        if (typography.size < MAX_TYPE_STYLES && type.family) {
            typography.set(JSON.stringify(type), type);
        }
        if (!role || components.length >= MAX_COMPONENT_STYLES)
            return style;
        components.push({
            role,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            color: opaqueValue(style.color),
            backgroundColor: opaqueValue(style.backgroundColor),
            backgroundImage: style.backgroundImage !== "none" ? style.backgroundImage : undefined,
            border: style.borderStyle !== "none" && style.borderWidth !== "0px"
                ? style.border
                : undefined,
            borderRadius: style.borderTopLeftRadius !== "0px" ? style.borderRadius : undefined,
            boxShadow: style.boxShadow !== "none" ? style.boxShadow : undefined,
            padding: style.padding !== "0px" ? style.padding : undefined,
            gap: style.gap !== "normal" ? style.gap : undefined,
            textTransform: style.textTransform !== "none" ? style.textTransform : undefined,
        });
        return style;
    }
    function styleFor(selector, role) {
        const element = firstVisible(selector);
        if (!element)
            return undefined;
        return recordComputedStyle(element, role);
    }
    function addAsset(raw, kind, role) {
        if (!raw || assets.size >= MAX_ASSETS)
            return;
        try {
            const url = new URL(raw, document.baseURI);
            if (url.protocol === "http:" || url.protocol === "https:") {
                url.hash = "";
                assets.set(url.href, {
                    url: url.href,
                    kind,
                    ...(role ? { role } : {}),
                });
            }
        }
        catch {
            return;
        }
    }
    for (const image of document.querySelectorAll("img")) {
        if (assets.size >= MAX_ASSETS)
            break;
        const identity = `${image.getAttribute("alt") ?? ""} ${image.getAttribute("class") ?? ""} ${image.id}`;
        addAsset(image.currentSrc || image.src, "image", /logo|wordmark|brandmark/i.test(identity) ? "logo" : undefined);
    }
    for (const video of document.querySelectorAll("video")) {
        if (assets.size >= MAX_ASSETS)
            break;
        addAsset(video.currentSrc || video.src, "video");
    }
    for (const audio of document.querySelectorAll("audio")) {
        if (assets.size >= MAX_ASSETS)
            break;
        addAsset(audio.currentSrc || audio.src, "audio");
    }
    for (const script of document.querySelectorAll("script[src]")) {
        if (assets.size >= MAX_ASSETS)
            break;
        addAsset(script.getAttribute("src"), "script");
    }
    for (const link of document.querySelectorAll("link[href]")) {
        if (assets.size >= MAX_ASSETS)
            break;
        const rel = link.getAttribute("rel") ?? "";
        const icon = /icon/i.test(rel);
        addAsset(link.getAttribute("href"), icon ? "image" : /font|preload/i.test(rel) ? "font" : "stylesheet", icon ? "logo" : undefined);
    }
    for (const meta of document.querySelectorAll('meta[property="og:image"],meta[property="og:image:url"],meta[name="twitter:image"]')) {
        if (assets.size >= MAX_ASSETS)
            break;
        addAsset(meta.getAttribute("content"), "image", "open-graph");
    }
    for (const anchor of document.querySelectorAll("a[href]")) {
        if (links.size >= MAX_LINKS)
            break;
        try {
            const url = new URL(anchor.getAttribute("href") ?? "", document.baseURI);
            if (url.origin === location.origin) {
                url.hash = "";
                links.add(url.href);
            }
        }
        catch {
            continue;
        }
    }
    const rootStyle = getComputedStyle(document.documentElement);
    let variableCount = 0;
    for (const name of rootStyle) {
        if (name.startsWith("--")) {
            const value = rootStyle.getPropertyValue(name).trim();
            if (value) {
                cssVariables[name] = value;
                variableCount++;
                if (variableCount >= MAX_VARIABLES)
                    break;
            }
        }
    }
    const bodyStyle = document.body
        ? recordComputedStyle(document.body)
        : undefined;
    const rootBackground = opaqueValue(rootStyle.backgroundColor);
    const bodyBackground = bodyStyle
        ? opaqueValue(bodyStyle.backgroundColor)
        : undefined;
    const textStyle = styleFor("p, li, label, body", "body");
    const buttonStyle = styleFor('button, [role="button"], input[type="submit"], a[class*="button" i], a[class*="cta" i]', "button");
    const linkStyle = styleFor("a[href]", "link");
    const cardStyle = styleFor('article, [class*="card" i], [class*="panel" i], [class*="surface" i], section', "card");
    styleFor("input, textarea, select", "input");
    styleFor("nav, header", "nav");
    styleFor('main, [class*="hero" i]', "hero");
    function setSemantic(role, value) {
        if (value)
            semanticColors[role] = value;
    }
    setSemantic("background", bodyBackground ?? rootBackground);
    setSemantic("surface", cardStyle ? opaqueValue(cardStyle.backgroundColor) : undefined);
    setSemantic("text", textStyle ? opaqueValue(textStyle.color) : undefined);
    const mutedElement = firstVisible("small, figcaption, [class*='muted' i]");
    setSemantic("textMuted", mutedElement
        ? opaqueValue(getComputedStyle(mutedElement).color)
        : undefined);
    setSemantic("accent", linkStyle
        ? opaqueValue(linkStyle.color)
        : buttonStyle
            ? opaqueValue(buttonStyle.backgroundColor)
            : undefined);
    setSemantic("primary", buttonStyle
        ? (opaqueValue(buttonStyle.backgroundColor) ??
            opaqueValue(buttonStyle.color))
        : colors[0]);
    setSemantic("secondary", semanticColors.surface ?? colors[1] ?? semanticColors.background);
    const layoutElement = firstVisible("main, [role='main'], body > div");
    const layoutStyle = layoutElement
        ? getComputedStyle(layoutElement)
        : undefined;
    const layoutRect = layoutElement?.getBoundingClientRect();
    const layout = {
        contentWidth: layoutStyle?.maxWidth && layoutStyle.maxWidth !== "none"
            ? layoutStyle.maxWidth
            : layoutRect && layoutRect.width > 0
                ? `${Math.round(layoutRect.width)}px`
                : undefined,
        pagePadding: bodyStyle?.padding && bodyStyle.padding !== "0px"
            ? bodyStyle.padding
            : undefined,
        sectionGap: firstVisible("section, article") &&
            getComputedStyle(firstVisible("section, article")).gap !== "normal" &&
            getComputedStyle(firstVisible("section, article")).gap !== "0px"
            ? getComputedStyle(firstVisible("section, article")).gap
            : undefined,
    };
    const elements = Array.from(document.querySelectorAll("body *"))
        .filter(visible)
        .slice(0, 700);
    for (const element of elements) {
        recordComputedStyle(element);
    }
    return {
        title: document.title,
        text: (document.body?.innerText ?? "").slice(0, MAX_TEXT),
        assets: [...assets.values()],
        internalLinks: [...links],
        designTokens: {
            colors,
            typography: [...typography.values()],
            spacing: [...spacing],
            radii: [...radii],
            cssVariables,
            semanticColors,
            shadows: [...shadows],
            backgrounds: [...backgrounds],
            components,
            layout,
        },
    };
}
function browserCaptureExpression() {
    // Bundlers can inject a module-scoped `__name` helper into nested functions.
    // Playwright serializes only the function body into Chromium, so provide the
    // tiny identity helper in the browser expression rather than leaking a
    // bundler runtime reference into the page.
    return `(function () {
    const __name = (value) => value;
    return (${captureRenderedWebsiteContext.toString()})();
  })()`;
}
export function boundWebsiteExtraction(extraction) {
    const boundedComponents = extraction.designTokens.components
        ?.slice(0, MAX_COMPONENT_STYLES)
        .map((component) => Object.fromEntries(Object.entries(component).map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 500) : value,
    ])));
    return {
        title: normalizeWhitespace(extraction.title).slice(0, 500),
        text: normalizeWhitespace(extraction.text).slice(0, MAX_RENDERED_TEXT_CHARS),
        assets: extraction.assets.slice(0, MAX_EXTRACTED_ASSETS).map((asset) => ({
            ...asset,
            url: asset.url.slice(0, 4_096),
        })),
        internalLinks: extraction.internalLinks
            .slice(0, MAX_INTERNAL_LINKS)
            .map((url) => url.slice(0, 4_096)),
        designTokens: {
            colors: extraction.designTokens.colors.slice(0, MAX_COLORS),
            typography: extraction.designTokens.typography.slice(0, MAX_TYPOGRAPHY),
            spacing: extraction.designTokens.spacing.slice(0, MAX_SPACING),
            radii: extraction.designTokens.radii.slice(0, MAX_RADII),
            cssVariables: Object.fromEntries(Object.entries(extraction.designTokens.cssVariables)
                .slice(0, MAX_CSS_VARIABLES)
                .map(([name, value]) => [name.slice(0, 500), value.slice(0, 4_096)])),
            ...(extraction.designTokens.semanticColors
                ? {
                    semanticColors: Object.fromEntries(Object.entries(extraction.designTokens.semanticColors)
                        .filter(([, value]) => typeof value === "string" && value)
                        .map(([name, value]) => [name, value.slice(0, 200)])),
                }
                : {}),
            ...(extraction.designTokens.shadows
                ? {
                    shadows: extraction.designTokens.shadows
                        .slice(0, 32)
                        .map((value) => value.slice(0, 500)),
                }
                : {}),
            ...(extraction.designTokens.backgrounds
                ? {
                    backgrounds: extraction.designTokens.backgrounds
                        .slice(0, 32)
                        .map((value) => value.slice(0, 500)),
                }
                : {}),
            ...(boundedComponents ? { components: boundedComponents } : {}),
            ...(extraction.designTokens.layout
                ? {
                    layout: Object.fromEntries(Object.entries(extraction.designTokens.layout)
                        .filter(([, value]) => typeof value === "string" && value)
                        .map(([name, value]) => [name, value.slice(0, 200)])),
                }
                : {}),
        },
    };
}
function emptyExtraction() {
    return {
        title: "",
        text: "",
        assets: [],
        internalLinks: [],
        designTokens: {
            colors: [],
            typography: [],
            spacing: [],
            radii: [],
            cssVariables: {},
        },
    };
}
function classifyWebsite(extraction, finalUrl) {
    const path = new URL(finalUrl).pathname.replace(/\/+$/, "") || "/";
    const sample = `${extraction.title} ${extraction.text.slice(0, 2_000)}`.toLowerCase();
    if (path === "/")
        return "homepage";
    if (/\b(api|docs?|guide|reference|tutorial)\b/.test(sample)) {
        return "documentation";
    }
    if (/\b(blog|article|news|author|published)\b/.test(sample))
        return "content";
    if (/\b(pricing|features|customers|solutions|product)\b/.test(sample)) {
        return "marketing";
    }
    return "unknown";
}
function boundedTimeout(value) {
    return Number.isFinite(value)
        ? Math.max(1_000, Math.min(120_000, Math.floor(value)))
        : 30_000;
}
function boundedScreenshot(value) {
    return value.byteLength <= MAX_SCREENSHOT_BYTES ? value : undefined;
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=rendered-page.js.map