// tests/migrate-production-brain.test.ts
//
// Regression guard for Finding 1: `brain_entries` is this app's first owned
// table, and its migration runner must be wired into the production release
// script (`scripts/migrate-production.ts`) inside the same
// `withMigrationRuntime` block as the framework's own release migrations.
// Without this, `ensureBrainTables()`'s request-path call silently no-ops in
// serverless production (runMigrations's self-guard) and every brain action
// fails on a fresh deploy.
//
// `scripts/migrate-production.ts` runs `main()` as a top-level side effect on
// import (it's a release script, not a library module), so this test can't
// safely import it directly in a unit test — running it would attempt a real
// migration/probe cycle. Instead it pins the wiring at the source level: the
// script imports `runBrainMigrations` and calls it inside `main`'s
// `withMigrationRuntime` callback, alongside `runFrameworkReleaseMigrations`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("../scripts/migrate-production.ts", import.meta.url),
);

describe("migrate-production.ts brain_entries wiring", () => {
  it("imports runBrainMigrations from the brain store", () => {
    const source = readFileSync(scriptPath, "utf8");
    expect(source).toMatch(
      /import\s*\{\s*runBrainMigrations\s*\}\s*from\s*["']\.\.\/server\/lib\/brain-store["']/,
    );
  });

  it("calls runBrainMigrations(null) inside the same withMigrationRuntime block as the framework release migrations", () => {
    const source = readFileSync(scriptPath, "utf8");
    const runtimeBlockMatch = source.match(
      /withMigrationRuntime\(async \(\) => \{([\s\S]*?)\n {2}\}\);/,
    );
    expect(runtimeBlockMatch).not.toBeNull();
    const runtimeBlock = runtimeBlockMatch![1];
    expect(runtimeBlock).toMatch(/runFrameworkReleaseMigrations\(null\)/);
    expect(runtimeBlock).toMatch(/runBrainMigrations\(null\)/);
  });
});
