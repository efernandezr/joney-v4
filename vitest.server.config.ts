import { fileURLToPath } from "node:url";

import baseConfig from "@agent-native/core/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

// Server-side tests (actions, framework store access) run WITHOUT the
// agent-native vite plugin: they need no React Router/Nitro pipeline, and the
// plugin's SSR module-graph settings force @opentelemetry's broken ESM build
// through vitest's module runner. Plain node environment externalizes it.
export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./app", import.meta.url)),
      },
    },
    test: {
      environment: "node",
      include: ["tests/**/*.test.{ts,tsx}"],
      env: {
        // Isolate server tests from the running app's dev database
        // (file:./data/app.db). The framework auto-creates and self-migrates
        // SQLite files on first use, so this file needs no manual setup.
        DATABASE_URL: "file:./data/vitest.db",
      },
    },
  }),
);
