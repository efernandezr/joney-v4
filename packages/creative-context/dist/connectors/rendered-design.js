import { classifyBrandKitToken, friendlyTokenName, normalizeBrandWebsiteUrl, } from "@agent-native/core/brand-kit";
import { LayeredRenderedPageProvider, } from "./rendered-page.js";
const MAX_DESIGN_MD_CHARS = 20_000;
const MAX_TOKENS = 500;
const FALLBACK_COLORS = {
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    primary: "#111827",
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    secondary: "#374151",
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    accent: "#2563EB",
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    background: "#FFFFFF",
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    surface: "#F9FAFB",
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    text: "#111827",
    // guard:allow-raw-color - fallback design-token data, not rendered UI color
    textMuted: "#6B7280",
};
/**
 * Extract a bounded visual language from a public website. Browser rendering
 * is deliberately delegated to the layered provider so this works with
 * Builder Browser, local Playwright, an approved attached browser, or the
 * existing SSRF-safe static fallback without changing app code.
 */
export async function extractRenderedDesignSystemFromUrl(websiteUrl, options = {}) {
    let url;
    try {
        url = normalizeBrandWebsiteUrl(websiteUrl);
    }
    catch (error) {
        return failedExtraction(websiteUrl, error);
    }
    const provider = options.provider ?? new LayeredRenderedPageProvider();
    let page;
    try {
        page = await provider.render({
            url,
            timeoutMs: options.timeoutMs,
            preferHosted: options.preferHosted,
            waitUntil: "load",
        });
    }
    catch (error) {
        return failedExtraction(url, error);
    }
    const designTokens = page.extraction.designTokens;
    const designMd = buildDesignMarkdown({
        url,
        finalUrl: page.finalUrl,
        title: page.title,
        rendered: page.rendered,
        method: page.method,
        confidence: page.confidence,
        designTokens,
        warnings: page.warnings,
    });
    const status = page.rendered
        ? page.warnings.length > 0 || page.screenshots.length < 2
            ? "partial"
            : "complete"
        : "partial";
    return {
        status,
        url,
        finalUrl: page.finalUrl,
        title: page.title,
        rendered: page.rendered,
        method: page.method,
        confidence: page.confidence,
        designTokens,
        designMd,
        brandKit: brandKitDataFromExtraction({
            url,
            finalUrl: page.finalUrl,
            title: page.title,
            designTokens,
            designMd,
            assets: page.extraction.assets,
        }),
        pageTitle: page.title,
        cssCustomProperties: designTokens.cssVariables,
        colors: designTokens.colors,
        fonts: uniqueStrings(designTokens.typography.map((style) => firstFontFamily(style.family))),
        fontFaces: designTokens.typography.slice(0, 24).map((style) => ({
            family: firstFontFamily(style.family),
            weight: style.weight,
        })),
        googleFonts: uniqueStrings(designTokens.typography.map((style) => firstFontFamily(style.family))),
        stylesheetUrls: page.extraction.assets
            .filter((asset) => asset.kind === "stylesheet")
            .map((asset) => asset.url)
            .slice(0, 64),
        assets: page.extraction.assets,
        screenshotEvidence: page.screenshots.map((screenshot) => ({
            viewport: screenshot.viewport,
            width: screenshot.width,
            height: screenshot.height,
            bytes: screenshot.data.byteLength,
        })),
        warnings: page.warnings,
        diagnostics: page.diagnostics,
    };
}
/** Convert the shared browser result into the Assets style-brief vocabulary. */
export function styleBriefFromRenderedDesign(extraction) {
    const tokens = extraction.designTokens;
    const typography = tokens?.typography ?? [];
    const componentStyles = tokens?.components ?? [];
    const semanticColors = tokens?.semanticColors ?? {};
    const bodyTypography = componentStyles.find((style) => style.role === "body");
    const headingTypography = componentStyles.find((style) => style.role === "heading");
    return {
        description: extraction.finalUrl
            ? `Rendered visual language extracted from ${extraction.finalUrl}.`
            : "Rendered visual language extracted from a website.",
        palette: tokens?.colors?.slice(0, 12) ?? [],
        fontFamilies: uniqueStrings(typography.map((style) => firstFontFamily(style.family))),
        fontWeights: uniqueStrings(typography
            .map((style) => style.weight)
            .concat(componentStyles.map((style) => style.fontWeight ?? ""))),
        typographyPolicy: typographyPolicy(headingTypography, bodyTypography),
        composition: tokens?.layout
            ? `Content width ${tokens.layout.contentWidth ?? "fluid"}; page padding ${tokens.layout.pagePadding ?? "not observed"}; section gap ${tokens.layout.sectionGap ?? "not observed"}.`
            : undefined,
        sourceUrl: extraction.finalUrl ?? extraction.url,
        rendered: extraction.rendered,
        designMd: extraction.designMd,
        semanticColors,
        spacing: tokens?.spacing?.slice(0, 24),
        radii: tokens?.radii?.slice(0, 16),
        shadows: tokens?.shadows?.slice(0, 12),
        backgrounds: tokens?.backgrounds?.slice(0, 12),
        componentStyles: componentStyles.slice(0, 12),
        cssVariables: tokens?.cssVariables,
        warnings: extraction.warnings,
    };
}
export function brandKitDataFromExtraction(input) {
    const tokens = input.designTokens;
    const semantic = tokens.semanticColors ?? {};
    const colors = {
        primary: semantic.primary ?? tokens.colors[0] ?? FALLBACK_COLORS.primary,
        secondary: semantic.secondary ?? tokens.colors[1] ?? FALLBACK_COLORS.secondary,
        accent: semantic.accent ?? tokens.colors[0] ?? FALLBACK_COLORS.accent,
        background: semantic.background ?? tokens.colors[2] ?? FALLBACK_COLORS.background,
        surface: semantic.surface ?? tokens.colors[3] ?? FALLBACK_COLORS.surface,
        text: semantic.text ?? tokens.colors[4] ?? FALLBACK_COLORS.text,
        textMuted: semantic.textMuted ?? tokens.colors[5] ?? FALLBACK_COLORS.textMuted,
    };
    const heading = tokens.components?.find((component) => component.role === "heading");
    const body = tokens.components?.find((component) => component.role === "body");
    const typography = tokens.typography;
    const headingTypography = typography[0];
    const bodyTypography = typography[1] ?? typography[0];
    const source = input.finalUrl ?? input.url;
    return {
        colors,
        typography: {
            headingFont: firstFontFamily(heading?.fontFamily ?? headingTypography?.family) ||
                "system-ui",
            bodyFont: firstFontFamily(body?.fontFamily ?? bodyTypography?.family) ||
                "system-ui",
            headingWeight: heading?.fontWeight ?? headingTypography?.weight ?? "700",
            bodyWeight: body?.fontWeight ?? bodyTypography?.weight ?? "400",
            headingSizes: {
                h1: componentFontSize(tokens, "heading", "h1") ?? "48px",
                h2: componentFontSize(tokens, "heading", "h2") ?? "36px",
                h3: componentFontSize(tokens, "heading", "h3") ?? "24px",
            },
        },
        spacing: {
            pagePadding: tokens.layout?.pagePadding ?? tokens.spacing[0] ?? "24px",
            elementGap: tokens.layout?.sectionGap ?? tokens.spacing[1] ?? "16px",
        },
        borders: {
            radius: tokens.radii[0] ?? "8px",
            accentWidth: "0px",
        },
        logos: (input.assets ?? [])
            .filter((asset) => asset.role === "logo")
            .slice(0, 12)
            .map((asset, index) => ({
            url: asset.url,
            name: `Logo ${index + 1}`,
            variant: "auto",
        })),
        tokens: tokensToBrandKitTokens(tokens, source),
        notes: [
            `Source: ${source}`,
            input.title ? `Page title: ${input.title}` : "",
            "The values above were inferred from the live computed browser cascade.",
            input.designMd,
        ]
            .filter(Boolean)
            .join("\n\n"),
    };
}
export function buildDesignMarkdown(input) {
    const tokens = input.designTokens;
    const semantic = tokens.semanticColors ?? {};
    const lines = [
        `# ${safeHeading(input.title || new URL(input.finalUrl).hostname)} design system`,
        "",
        `Source: ${input.finalUrl}`,
        `Extraction: ${input.rendered ? "real browser computed styles" : "SSRF-safe static HTML fallback"} (${input.method}; confidence ${Math.round(input.confidence * 100)}%)`,
        "",
        "## Colors",
        ...roleLines(semantic),
        ...(tokens.colors.length > 0
            ? ["", `Observed palette: ${tokens.colors.slice(0, 16).join(", ")}`]
            : ["", "No visible color samples were available."]),
        "",
        "## Typography",
        ...tokens.typography
            .slice(0, 12)
            .map((style) => `- ${style.family}; ${style.size}; weight ${style.weight}; line-height ${style.lineHeight}; tracking ${style.letterSpacing}`),
        ...(tokens.typography.length === 0
            ? ["- No visible typography samples were available."]
            : []),
        "",
        "## Spacing, shape, and depth",
        `- Spacing: ${tokens.spacing.slice(0, 20).join(", ") || "not observed"}`,
        `- Radii: ${tokens.radii.slice(0, 12).join(", ") || "not observed"}`,
        `- Shadows: ${(tokens.shadows ?? []).slice(0, 8).join("; ") || "not observed"}`,
        `- Background treatments: ${(tokens.backgrounds ?? []).slice(0, 8).join("; ") || "not observed"}`,
        ...(tokens.layout
            ? [
                `- Layout: content width ${tokens.layout.contentWidth ?? "fluid"}; page padding ${tokens.layout.pagePadding ?? "not observed"}; section gap ${tokens.layout.sectionGap ?? "not observed"}`,
            ]
            : []),
        "",
        "## Component language",
        ...(tokens.components ?? [])
            .slice(0, 12)
            .map((component) => [
            `- ${component.role}:`,
            component.fontFamily,
            component.fontSize ? `size ${component.fontSize}` : undefined,
            component.fontWeight ? `weight ${component.fontWeight}` : undefined,
            component.color ? `color ${component.color}` : undefined,
            component.backgroundColor
                ? `background ${component.backgroundColor}`
                : undefined,
            component.backgroundImage
                ? `background image ${component.backgroundImage}`
                : undefined,
            component.borderRadius
                ? `radius ${component.borderRadius}`
                : undefined,
            component.boxShadow ? `shadow ${component.boxShadow}` : undefined,
            component.padding ? `padding ${component.padding}` : undefined,
            component.textTransform
                ? `case ${component.textTransform}`
                : undefined,
        ]
            .filter(Boolean)
            .join("; ")),
        ...((tokens.components ?? []).length === 0
            ? ["- No representative visible component styles were available."]
            : []),
        "",
        "## CSS variables",
        ...Object.entries(tokens.cssVariables)
            .slice(0, 64)
            .map(([name, value]) => `- ${name}: ${value}`),
        ...(Object.keys(tokens.cssVariables).length === 0
            ? ["- No root CSS custom properties were available."]
            : []),
        ...(input.warnings.length > 0
            ? [
                "",
                "## Extraction notes",
                ...input.warnings.map((warning) => `- ${warning}`),
            ]
            : []),
    ];
    return lines.join("\n").slice(0, MAX_DESIGN_MD_CHARS);
}
function failedExtraction(url, error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
        status: "failed",
        url,
        rendered: false,
        warnings: [],
        diagnostics: [],
        error: message,
    };
}
function roleLines(colors) {
    const roles = [
        "primary",
        "secondary",
        "accent",
        "background",
        "surface",
        "text",
        "textMuted",
    ];
    return roles.map((role) => `- ${role}: ${colors[role] ?? "not observed"}`);
}
function firstFontFamily(value) {
    return (value
        ?.split(",")[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, "") ?? "");
}
function uniqueStrings(values) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
function typographyPolicy(heading, body) {
    if (!heading && !body)
        return undefined;
    return [
        heading
            ? `Headings use ${firstFontFamily(heading.fontFamily)} at ${heading.fontWeight ?? "default"} weight.`
            : "",
        body
            ? `Body copy uses ${firstFontFamily(body.fontFamily)} at ${body.fontWeight ?? "default"} weight.`
            : "",
    ]
        .filter(Boolean)
        .join(" ");
}
function componentFontSize(tokens, role, level) {
    const heading = tokens.components?.find((component) => component.role === role);
    if (!heading?.fontSize)
        return undefined;
    if (level === "h1")
        return heading.fontSize;
    const numeric = Number.parseFloat(heading.fontSize);
    if (!Number.isFinite(numeric))
        return heading.fontSize;
    return `${Math.max(level === "h2" ? 24 : 18, Math.round(numeric * (level === "h2" ? 0.75 : 0.58)))}px`;
}
function tokensToBrandKitTokens(tokens, source) {
    const entries = Object.entries(tokens.cssVariables).slice(0, MAX_TOKENS);
    const cssTokens = entries.map(([cssVar, value]) => ({
        name: friendlyTokenName(cssVar),
        cssVar,
        value,
        type: classifyBrandKitToken(cssVar, value),
        source,
    }));
    const observedColors = tokens.colors.slice(0, 32).map((value, index) => ({
        name: `Observed Color ${index + 1}`,
        cssVar: `--observed-color-${index + 1}`,
        value,
        type: "color",
        source,
    }));
    return [...cssTokens, ...observedColors].slice(0, MAX_TOKENS);
}
function safeHeading(value) {
    return (value
        .replace(/[\r\n#]/g, " ")
        .trim()
        .slice(0, 160) || "Website");
}
//# sourceMappingURL=rendered-design.js.map