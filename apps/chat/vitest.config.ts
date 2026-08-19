import baseConfig from "@agent-native/core/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

// Kept separate from vite.config.ts so the production config never imports
// vitest: `agent-native build` loads vite.config.ts in installs where vitest
// is absent.
// tests/** are server-module tests and run under vitest.server.config.ts
// (see package.json "test") — the agent-native vite plugin cannot load
// @opentelemetry's ESM build in the module runner.
export default mergeConfig(
  mergeConfig(viteConfig, baseConfig),
  defineConfig({
    test: {
      exclude: ["**/node_modules/**", "**/dist/**", "tests/**"],
    },
  }),
);
