/**
 * Base-path-aware settings tab routing, shared by every workspace app.
 *
 * Core's SettingsTabsPage (through at least 0.176.1) syncs tabs to the URL
 * with a raw `history.pushState("/settings/<tab>")`, which drops the
 * workspace mount prefix (/<app>) and breaks every URL-derived link built
 * afterwards (e.g. the MCP OAuth start endpoint). Each app's settings route
 * therefore drives the component in controlled mode: React Router owns
 * tab <-> URL sync (basename-aware), and these helpers translate between the
 * route splat and the framework's tab ids using the same normalization rules
 * as the framework's `buildSettingsRoute`/`normalizeTabId`.
 */

/** Mirrors the framework's normalizeTabId aliases (navigation/index.js). */
function normalizeTabId(tab: string): string {
  const normalized = tab
    .trim()
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-");
  if (normalized === "connections") return "integrations";
  if (normalized === "team" || normalized === "org") return "organization";
  if (
    normalized === "changelog" ||
    normalized === "what-s-new" ||
    normalized === "updates"
  ) {
    return "whats-new";
  }
  return normalized;
}

/**
 * Resolve the active tab id from the settings route splat ("agent/resources")
 * by longest-prefix match against the known tab ids, falling back to general.
 */
export function resolveSettingsTab(
  splat: string | undefined,
  knownTabIds: ReadonlySet<string>,
): string {
  const segments = (splat ?? "")
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
  for (let length = segments.length; length > 0; length -= 1) {
    const candidate = normalizeTabId(segments.slice(0, length).join(":"));
    if (knownTabIds.has(candidate)) return candidate;
    // The built-in team tab keeps id "team" while its canonical URL segment
    // is "organization" — mirror the framework's resolveTabId fallback.
    if (candidate === "organization" && knownTabIds.has("team")) return "team";
  }
  return "general";
}

/** App-relative route for a tab id; React Router applies the basename. */
export function settingsTabPath(tabId: string): string {
  const normalized = normalizeTabId(tabId);
  if (!normalized || normalized === "general") return "/settings";
  const segments = normalized
    .split(":")
    .map((segment) => encodeURIComponent(segment))
    .filter(Boolean);
  return `/settings/${segments.join("/")}`;
}

/**
 * When the framework's own pushState stripped the base path from a settings
 * URL, return the repaired absolute pathname; null when no repair is needed.
 */
export function repairSettingsPathname(
  pathname: string,
  basePath: string,
): string | null {
  if (!basePath) return null;
  if (pathname !== "/settings" && !pathname.startsWith("/settings/")) {
    return null;
  }
  return `${basePath}${pathname}`;
}

/**
 * Pre-flight version of the repair for intercepting history.pushState /
 * replaceState calls: several framework components (e.g. core 0.176.1's
 * AgentWorkspaceContent resource sub-tabs) push bare "/settings/..." URLs and
 * then dispatch a synthetic popstate. If the un-prefixed URL ever reaches
 * React Router's popstate handler, a URL outside the router basename forces a
 * full document load that the workspace gateway cannot route (blank page).
 * Rewriting the URL BEFORE the pushState lands avoids the race entirely.
 * Accepts whatever the history API was called with; returns the prefixed URL
 * string, or null when the call should pass through untouched.
 */
export function prefixedSettingsHistoryUrl(
  url: unknown,
  basePath: string,
): string | null {
  if (!basePath || typeof url !== "string") return null;
  const pathname = url.split(/[?#]/, 1)[0] ?? "";
  if (pathname !== "/settings" && !pathname.startsWith("/settings/")) {
    return null;
  }
  return `${basePath}${url}`;
}
