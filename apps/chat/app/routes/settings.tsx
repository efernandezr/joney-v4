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
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

import { APP_TITLE } from "@/lib/app-config";
import {
  repairSettingsPathname,
  resolveSettingsTab,
  settingsTabPath,
} from "@/lib/settings-tab-routing";

import changelog from "../../CHANGELOG.md?raw";

export function meta() {
  return [{ title: `Settings - ${APP_TITLE}` }];
}

export default function SettingsRoute() {
  const t = useT();
  const agentSettingsTabs = useAgentSettingsTabs();
  const navigate = useNavigate();
  const params = useParams();
  useSetPageTitle(t("settings.title"));

  // Drive SettingsTabsPage in controlled mode so tab <-> URL sync goes through
  // React Router (basename-aware). The framework's uncontrolled mode pushes
  // bare "/settings/<tab>" URLs, which drops the /chat workspace mount and
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

  // Safety net for the framework code paths that still pushState a bare
  // "/settings/..." URL (e.g. settings-search entries with a section hash):
  // it dispatches popstate right after, so repair the pathname there.
  useEffect(() => {
    const repair = () => {
      const repaired = repairSettingsPathname(
        window.location.pathname,
        appBasePath(),
      );
      if (repaired) {
        window.history.replaceState(
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
      window.removeEventListener("popstate", repair);
      window.removeEventListener("hashchange", repair);
    };
  }, []);

  const generalSearchEntries = useMemo<SettingsSearchEntry[]>(
    () => [
      {
        id: "chat-language",
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
      team={
        <div className="mx-auto w-full max-w-3xl">
          <TeamPage
            showTitle={false}
            createOrgDescription={t("pages.teamCreateOrgDescription")}
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
