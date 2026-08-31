import { describe, expect, it } from "vitest";

import {
  repairSettingsPathname,
  resolveSettingsTab,
  settingsTabPath,
} from "../app/lib/settings-tab-routing";

const KNOWN = new Set([
  "general",
  "account",
  "organization",
  "whats-new",
  "agent",
  "providers",
  "integrations",
  "agent:resources:skills",
]);

describe("resolveSettingsTab", () => {
  it("maps the empty splat to the general tab", () => {
    expect(resolveSettingsTab("", KNOWN)).toBe("general");
    expect(resolveSettingsTab(undefined, KNOWN)).toBe("general");
  });

  it("maps a single segment to its tab id", () => {
    expect(resolveSettingsTab("integrations", KNOWN)).toBe("integrations");
  });

  it("joins nested segments with ':' and longest-prefix matches", () => {
    expect(resolveSettingsTab("agent/resources/skills", KNOWN)).toBe(
      "agent:resources:skills",
    );
    // deeper path than any known tab falls back to the longest known prefix
    expect(resolveSettingsTab("agent/resources/skills/extra", KNOWN)).toBe(
      "agent:resources:skills",
    );
    expect(resolveSettingsTab("agent/unknown", KNOWN)).toBe("agent");
  });

  it("honors the framework's tab aliases", () => {
    expect(resolveSettingsTab("connections", KNOWN)).toBe("integrations");
    expect(resolveSettingsTab("team", KNOWN)).toBe("organization");
    expect(resolveSettingsTab("org", KNOWN)).toBe("organization");
    expect(resolveSettingsTab("changelog", KNOWN)).toBe("whats-new");
  });

  it("decodes URL-encoded segments", () => {
    expect(resolveSettingsTab("what%73-new", KNOWN)).toBe("whats-new");
  });

  it("falls back to general for unknown tabs", () => {
    expect(resolveSettingsTab("bogus", KNOWN)).toBe("general");
  });

  it("resolves organization to the built-in team tab when only 'team' exists", () => {
    const teamOnly = new Set(["general", "team"]);
    expect(resolveSettingsTab("organization", teamOnly)).toBe("team");
    expect(resolveSettingsTab("team", teamOnly)).toBe("team");
  });
});

describe("settingsTabPath", () => {
  it("keeps the general tab on the bare settings path", () => {
    expect(settingsTabPath("general")).toBe("/settings");
  });

  it("maps a tab id to a settings sub-path", () => {
    expect(settingsTabPath("integrations")).toBe("/settings/integrations");
  });

  it("expands ':' tab ids into nested segments", () => {
    expect(settingsTabPath("agent:resources:skills")).toBe(
      "/settings/agent/resources/skills",
    );
  });
});

describe("repairSettingsPathname", () => {
  it("prefixes a base-path-stripped settings pathname", () => {
    expect(repairSettingsPathname("/settings/integrations", "/chat")).toBe(
      "/chat/settings/integrations",
    );
    expect(repairSettingsPathname("/settings", "/chat")).toBe("/chat/settings");
  });

  it("returns null when the pathname already carries the base path", () => {
    expect(
      repairSettingsPathname("/chat/settings/integrations", "/chat"),
    ).toBeNull();
  });

  it("returns null without a base path (standalone mount)", () => {
    expect(repairSettingsPathname("/settings/integrations", "")).toBeNull();
  });

  it("ignores non-settings pathnames", () => {
    expect(repairSettingsPathname("/settingsfoo", "/chat")).toBeNull();
    expect(repairSettingsPathname("/brain", "/chat")).toBeNull();
  });
});
