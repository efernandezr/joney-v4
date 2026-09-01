import { appBasePath } from "@agent-native/core/client/api-path";
import { ChangelogSettingsCard } from "@agent-native/core/client/changelog";
import { LanguagePicker, useT } from "@agent-native/core/client/i18n";
import { TeamPage } from "@agent-native/core/client/org";
import {
  AccountSettingsCard,
  SettingsGroup,
  SettingsRow,
  SettingsTabsPage,
  useAgentSettingsTabs,
  type SettingsSearchEntry,
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

import messages from "@/i18n/en-US";

import changelog from "../../CHANGELOG.md?raw";

export function meta() {
  return [{ title: messages.routeTitles.settingsForms }];
}

export default function SettingsRoute() {
  const t = useT();
  // /extensions redirects here and the agent's own navigate instructions list
  // "extensions" as a workspace view, so the settings tab must exist too —
  // otherwise /settings/extensions silently falls back to General.
  const agentSettingsTabs = useAgentSettingsTabs({ extensionTools: true });
  const navigate = useNavigate();
  const params = useParams();
  useSetPageTitle(t("settings.title"));

  // Drive SettingsTabsPage in controlled mode so tab <-> URL sync goes through
  // React Router (basename-aware). The framework's uncontrolled mode pushes
  // bare "/settings/<tab>" URLs, which drops the /forms workspace mount and
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
  // settings-search entries with a section hash). If React Router's popstate
  // handler ever observes the un-prefixed URL — outside the /forms basename —
  // it forces a full document load the workspace gateway cannot route (blank
  // page). Intercept pushState/replaceState while this route is mounted and
  // prefix such URLs BEFORE they land, so the race cannot occur; keep a
  // popstate/hashchange repair as a belt-and-braces fallback.
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

  const generalSearchEntries = useMemo<SettingsSearchEntry[]>(
    () => [
      {
        id: "forms-language",
        label: t("settings.languageTitle"),
        keywords: "language locale translation i18n",
        hash: "language",
      },
    ],
    [t],
  );

  return (
    <SettingsTabsPage
      value={activeTab}
      onValueChange={handleTabChange}
      account={<AccountSettingsCard />}
      teamLabel={t("navigation.team")}
      extraTabs={agentSettingsTabs}
      generalSearchEntries={generalSearchEntries}
      general={
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("settings.description")}
          </p>

          <SettingsGroup className="forms-settings-card">
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
      team={
        <div className="mx-auto w-full max-w-3xl">
          <TeamPage
            showTitle={false}
            createOrgDescription="Set up a team to share forms and view responses together."
          />
        </div>
      }
      whatsNew={
        <div className="mx-auto w-full max-w-2xl">
          <ChangelogSettingsCard markdown={changelog} />
        </div>
      }
    />
  );
}
