// Export shared React components and hooks here when multiple apps need them.
export {
  prefixedSettingsHistoryUrl,
  repairSettingsPathname,
  resolveSettingsTab,
  settingsTabPath,
} from "./settings-routing";
export {
  currentWorkspaceAppId,
  useWorkspaceAppLinks,
  type UseWorkspaceAppLinksResult,
  type WorkspaceAppLink,
} from "./workspace-apps-nav";
