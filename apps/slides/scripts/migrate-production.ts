import {
  closeDbExec,
  runMigrations,
  withMigrationRuntime,
} from "@agent-native/core/db";
import { runFrameworkReleaseMigrations } from "@agent-native/core/server";
import { creativeContextMigrations } from "@agent-native/creative-context/schema";

import { runSlidesMigrations } from "../server/plugins/db.js";

/**
 * Release-time schema entrypoint for Slides.
 *
 * This script is the production owner of schema changes. It runs against the
 * direct migration endpoint selected by core, while request functions skip
 * all migration and ensure-table work automatically.
 */

// The creative-context package registers these migrations only as a Nitro
// plugin, which core's self-guard skips in serverless request runtimes — so
// the release script must own them or the creative_context_* tables never
// exist on a fresh production database. Same ledger table as the plugin so
// dev and prod share one applied-migrations record; the entries are named,
// so whichever consumer app's release script runs first applies them and the
// rest no-op.
const runCreativeContextMigrations = runMigrations(
  creativeContextMigrations as Parameters<typeof runMigrations>[0],
  { table: "creative_context_migrations" },
);

async function main(): Promise<void> {
  await withMigrationRuntime(async () => {
    await runFrameworkReleaseMigrations(null);
    await runSlidesMigrations(null);
    await runCreativeContextMigrations(null);
  });
}

try {
  await main();
} finally {
  await closeDbExec();
}
