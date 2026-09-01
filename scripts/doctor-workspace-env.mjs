// Workspace env preflight, run before `agent-native dev` (see root
// package.json "dev"). Two incidents motivated it: the workspace root .env
// losing A2A_SECRET went unnoticed until cross-app agent calls silently ran
// anonymous, and a second A2A_SECRET accidentally appended to apps/chat/.env
// shadowed the root value and 403'd the whole chat app behind the fail-closed
// workspace ACL. Both are invisible at startup without this check.
//
// Never prints secret values — presence only. Skip with
// AGENT_NATIVE_SKIP_ENV_DOCTOR=1.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const REQUIRED_ROOT_VARS = [
  // Cross-app A2A signing; without it call-agent runs unauthenticated in dev
  // and receivers see no user identity.
  "A2A_SECRET",
  // Pins the fail-closed workspace-app ACL to the dev gateway's Dispatch.
  "AGENT_NATIVE_ORG_DIRECTORY_URL",
  // Agent engine provider key shared by every app.
  "OPENAI_API_KEY",
];

// Workspace doctrine: one shared dev database. An app-level override of any
// of these silently splits identity or trust between apps.
const FORBIDDEN_APP_VARS = [
  "A2A_SECRET",
  "AGENT_NATIVE_ORG_DIRECTORY_URL",
  "DATABASE_URL",
];

function envKeys(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const keys = new Set();
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
    if (match) keys.add(match[1]);
  }
  return keys;
}

if (process.env.AGENT_NATIVE_SKIP_ENV_DOCTOR === "1") {
  console.log("[env-doctor] skipped (AGENT_NATIVE_SKIP_ENV_DOCTOR=1)");
  process.exit(0);
}

const errors = [];
const warnings = [];

const rootEnvPath = path.join(workspaceRoot, ".env");
const rootKeys = envKeys(rootEnvPath);
if (!rootKeys) {
  errors.push(
    `missing ${rootEnvPath} — create it with ${REQUIRED_ROOT_VARS.join(", ")} (values live outside git)`,
  );
} else {
  for (const key of REQUIRED_ROOT_VARS) {
    if (!rootKeys.has(key)) {
      errors.push(`root .env is missing ${key}`);
    }
  }
  if (!rootKeys.has("DATABASE_URL")) {
    warnings.push(
      "root .env has no DATABASE_URL — apps fall back to the gateway default; fine unless the shared dev DB stops lining up across apps",
    );
  }
}

const appsDir = path.join(workspaceRoot, "apps");
for (const appName of fs.existsSync(appsDir) ? fs.readdirSync(appsDir) : []) {
  const appEnvPath = path.join(appsDir, appName, ".env");
  const appKeys = envKeys(appEnvPath);
  if (!appKeys) continue;
  for (const key of FORBIDDEN_APP_VARS) {
    if (appKeys.has(key)) {
      errors.push(
        `apps/${appName}/.env defines ${key} — it shadows the workspace root value for this app only and desynchronizes cross-app trust; remove it (root .env is the source of truth)`,
      );
    }
  }
}

for (const warning of warnings) console.warn(`[env-doctor] warning: ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`[env-doctor] ERROR: ${error}`);
  console.error(
    "[env-doctor] fix the above (or rerun with AGENT_NATIVE_SKIP_ENV_DOCTOR=1 to bypass once)",
  );
  process.exit(1);
}
console.log(
  `[env-doctor] ok — root .env has ${REQUIRED_ROOT_VARS.join(", ")}; no app-level shadowing`,
);
