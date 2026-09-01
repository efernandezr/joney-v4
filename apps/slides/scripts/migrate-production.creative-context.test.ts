// Regression guard (same class as chat's migrate-production-brain test): the
// creative-context package registers its migrations only as a Nitro plugin,
// which core's runMigrations self-guard SKIPS in serverless request runtimes.
// Unless the release script runs them, creative_context_* tables never exist
// on a fresh production database and every list-creative-contexts call fails
// (observed on Neon 2026-09-01). The script runs main() on import, so this
// pins the wiring at the source level instead of importing it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("./migrate-production.ts", import.meta.url),
);

describe("migrate-production.ts creative-context wiring", () => {
  it("builds the release runner from the package's migration list with the plugin's ledger table", () => {
    const source = readFileSync(scriptPath, "utf8");
    expect(source).toMatch(
      /from\s*["']@agent-native\/creative-context\/schema["']/,
    );
    expect(source).toMatch(
      /\{\s*table:\s*["']creative_context_migrations["']\s*\}/,
    );
  });

  it("calls runCreativeContextMigrations(null) inside the withMigrationRuntime block", () => {
    const source = readFileSync(scriptPath, "utf8");
    const block = source.match(
      /withMigrationRuntime\(async \(\) => \{([\s\S]*?)\n\s*\}\);/,
    );
    expect(block).not.toBeNull();
    expect(block![1]).toMatch(/runCreativeContextMigrations\(null\)/);
  });
});
