import { appBasePath } from "@agent-native/core/client/api-path";
import { LanguagePicker, useT } from "@agent-native/core/client/i18n";
import {
  SettingsGroup,
  SettingsRow,
  SettingsTabsPage,
  useAgentSettingsTabs,
} from "@agent-native/core/client/settings";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import {
  prefixedSettingsHistoryUrl,
  repairSettingsPathname,
  resolveSettingsTab,
  settingsTabPath,
} from "@joney-ai/shared/client";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Settings - ${APP_TITLE}` }];
}

export default function SettingsRoute() {
  const t = useT();
  // Tasks embeds an ExtensionSlot in TaskFieldsSidebar and wires /extensions
  // into agent navigation, so the settings management tab must exist too —
  // otherwise the /settings/extensions destination silently falls back to General.
  const agentSettingsTabs = useAgentSettingsTabs({ extensionTools: true });
  const navigate = useNavigate();
  const params = useParams();
  useSetPageTitle(t("header.pageSettings"));

  // Drive SettingsTabsPage in controlled mode so tab <-> URL sync goes through
  // React Router (basename-aware). The framework's uncontrolled mode pushes
  // bare "/settings/<tab>" URLs, which drops the /tasks workspace mount and
  // breaks every URL-derived link built afterwards (MCP OAuth start, reloads).
  const knownTabIds = useMemo(() => {
    const ids = new Set<string>(["general", "account", "whats-new"]);
    let hasOrganizationTab = false;
    for (const tab of agentSettingsTabs) {
      if (tab.href) continue; // linked tabs navigate elsewhere via <Link>
      ids.add(tab.id);
      if (tab.id === "organization") hasOrganizationTab = true;
    }
    if (!hasOrganizationTab) ids.add("team");
    return ids;
  }, [agentSettingsTabs]);

  const activeTab = resolveSettingsTab(params["*"], knownTabIds);

  const handleTabChange = useCallback(
    (tabId: string) => {
      const target = settingsTabPath(tabId);
      navigate(`${target}${window.location.search}`);
    },
    [navigate],
  );

  // Several framework components pushState bare "/settings/..." URLs and then
  // dispatch a synthetic popstate (core 0.176.1's agent-hub resource sub-tabs,
  // settings-search entries with a section hash). Intercept pushState/
  // replaceState while this route is mounted and prefix such URLs BEFORE they
  // land; keep a popstate/hashchange repair as a belt-and-braces fallback.
  useEffect(() => {
    const { pushState, replaceState } = window.history;
    const wrap =
      (original: typeof window.history.pushState) =>
      function (this: History, data: unknown, unused: string, url?: unknown) {
        const prefixed = prefixedSettingsHistoryUrl(url, appBasePath());
        return original.call(this, data, unused, (prefixed ?? url) as string);
      };
    window.history.pushState = wrap(pushState);
    window.history.replaceState = wrap(replaceState);

    const repair = () => {
      const repaired = repairSettingsPathname(
        window.location.pathname,
        appBasePath(),
      );
      if (repaired) {
        replaceState.call(
          window.history,
          null,
          "",
          `${repaired}${window.location.search}${window.location.hash}`,
        );
      }
    };
    repair();
    window.addEventListener("popstate", repair);
    window.addEventListener("hashchange", repair);
    return () => {
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
      window.removeEventListener("popstate", repair);
      window.removeEventListener("hashchange", repair);
    };
  }, []);

  return (
    <SettingsTabsPage
      value={activeTab}
      onValueChange={handleTabChange}
      extraTabs={agentSettingsTabs}
      general={
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("header.pageSettings")}
          </p>

          <SettingsGroup>
            <SettingsRow
              id="language"
              label={t("settings.languageTitle")}
              description={t("settings.languageDescription")}
              control={
                <div className="w-56">
                  <LanguagePicker label={t("settings.languageLabel")} />
                </div>
              }
            />
          </SettingsGroup>
        </div>
      }
    />
  );
}
