// Collapse the per-asset immutable-cache-header routes that
// @agent-native/core's vercel workspace preset writes into
// .vercel/output/config.json (one route per hashed asset per app) into a
// single regex route. Vercel rejects deployments with more than 2048 routes,
// and six apps' Vite chunks exceed that. Runs from vercel.json's buildCommand
// right after the framework build step. Upstream-report candidate.
import fs from "node:fs";

const CONFIG_PATH = ".vercel/output/config.json";
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
// Same shape as core's IMMUTABLE_ASSET_PATH_PATTERN, prefixed with the app
// base path segment: /<app>/assets/<name>-<8 char hash>.<ext>
const COLLAPSED_SRC = "^/[^/]+/assets/[^/]+-[A-Za-z0-9_-]{8}\\.[a-z0-9]+$";
const VERCEL_ROUTE_LIMIT = 2048;

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`[compress-vercel-routes] ${CONFIG_PATH} not found — run after the workspace build step`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const routes = Array.isArray(config.routes) ? config.routes : [];

const isPerAssetHeaderRoute = (route) =>
  route?.continue === true &&
  route?.headers?.["cache-control"] === IMMUTABLE_CACHE_CONTROL &&
  typeof route?.src === "string" &&
  route.src.includes("/assets/") &&
  route.dest === undefined;

const kept = [];
let removed = 0;
for (const route of routes) {
  if (isPerAssetHeaderRoute(route)) {
    if (removed === 0) {
      kept.push({ src: COLLAPSED_SRC, headers: route.headers, continue: true });
    }
    removed += 1;
    continue;
  }
  kept.push(route);
}

if (removed === 0) {
  console.warn("[compress-vercel-routes] no per-asset header routes found; config left unchanged (upstream may have fixed this)");
} else {
  config.routes = kept;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}
console.log(`[compress-vercel-routes] routes: ${routes.length} -> ${kept.length} (collapsed ${removed} per-asset header routes)`);

if (kept.length > VERCEL_ROUTE_LIMIT) {
  console.error(`[compress-vercel-routes] still over Vercel's ${VERCEL_ROUTE_LIMIT}-route limit`);
  process.exit(1);
}
