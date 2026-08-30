import {
  deleteAppState,
  writeAppState,
} from "@agent-native/core/application-state";
import {
  closeDbExec,
  getDbExec,
  withMigrationRuntime,
} from "@agent-native/core/db";
import { deleteRun, startRun } from "@agent-native/core/progress";
import {
  resourceDeleteByPath,
  resourcePut,
  SHARED_OWNER,
} from "@agent-native/core/resources/store";
import {
  deleteAppSecret,
  writeAppSecret,
} from "@agent-native/core/secrets";
import {
  runFrameworkReleaseMigrations,
  runWithRequestContext,
} from "@agent-native/core/server";
import { deleteSetting, putSetting } from "@agent-native/core/settings";
import { recordUsage } from "@agent-native/core/usage";

import { runBrainMigrations } from "../server/lib/brain-store";

/**
 * Release-time schema entrypoint.
 *
 * Every deploy runs this once, and request functions never touch schema. That
 * ordering is not an optimization: on serverless, "migrate on first use" means
 * migrate on EVERY cold start, and a production incident traced a multi-hour
 * outage to schema introspection running 4-6 times concurrently on the request
 * path.
 *
 * `withMigrationRuntime()` is load-bearing. The Netlify BUILD environment sets
 * NETLIFY=true, so this script looks like a serverless request to the guard in
 * `runMigrations` — it is allowed to migrate only because it claims duty here.
 * A release entrypoint that forgets the wrapper silently does nothing.
 *
 * If this app owns tables of its own, export its migration runner (e.g.
 * `runBrainMigrations` from `server/lib/brain-store.ts` below) and call it
 * inside the same block.
 */
async function main(): Promise<void> {
  await withMigrationRuntime(async () => {
    await runFrameworkReleaseMigrations(null);
    // This app's own owned table (brain_entries). Serverless request
    // runtimes skip DDL (runMigrations's self-guard), so without this call
    // the table is never created in production and every brain action fails.
    await runBrainMigrations(null);
    // The settings / application_state / resources stores create their tables
    // on first WRITE (ensureTable), but production read paths (agent-engine
    // status, MCP config, artifact lists) hit them earlier and fail with
    // "relation does not exist" on a fresh database. Touch each store here so
    // the tables exist before the first request. Probe rows self-delete.
    await runWithRequestContext(
      { userEmail: "release-probe@local" },
      async () => {
        await putSetting("__release_probe__", { ok: true });
        await deleteSetting("__release_probe__");
        await writeAppState("__release_probe__", { ok: true });
        await deleteAppState("__release_probe__");
        await resourcePut(
          SHARED_OWNER,
          "agent_scratch/.release-probe.txt",
          "probe",
          "text/plain",
        );
        await resourceDeleteByPath(
          SHARED_OWNER,
          "agent_scratch/.release-probe.txt",
        );
        // app_secrets (encrypted vault): the org-deletion handler reads it
        // for cleanup before anything ever wrote a secret.
        await writeAppSecret({
          key: "__release_probe__",
          scope: "workspace",
          scopeId: "release-probe",
          value: "probe",
        });
        await deleteAppSecret({
          key: "__release_probe__",
          scope: "workspace",
          scopeId: "release-probe",
        });
        // token_usage: schemaEnsureDisabled() makes every ensureTable() a no-op
        // in production serverless, so even usage WRITES fail until this table
        // exists — the Usage settings page 500s and no spend is ever recorded.
        await recordUsage({
          ownerEmail: "release-probe@local",
          inputTokens: 1,
          outputTokens: 0,
          model: "",
          label: "__release_probe__",
          refId: "__release_probe__",
          costSource: "unavailable",
        });
        // No exported delete for usage rows; scoped to the probe's own
        // (label, ref_id) pair, same key the framework uses for re-record dedupe.
        await getDbExec().execute({
          sql: `DELETE FROM token_usage WHERE label = ? AND ref_id = ?`,
          args: ["__release_probe__", "__release_probe__"],
        });
        // progress_runs: the /runs poll reads it on every open tab and 500s
        // until the table exists.
        const probeRun = await startRun({
          owner: "release-probe@local",
          title: "__release_probe__",
        });
        await deleteRun(probeRun.id, "release-probe@local");
      },
    );
  });
}

try {
  await main();
} finally {
  await closeDbExec();
}
