/**
 * Workspace app links for cross-app navigation, shared by every Joney app.
 *
 * Built only on core's public client seams: the per-app
 * `list-workspace-apps` registry action and `parseWorkspaceAppLinks` /
 * `isWorkspaceAppEnvironment` from `@agent-native/core/client/org` (the same
 * data the built-in OrgSwitcher "Apps" submenu shows). Apps render the result
 * with their own sidebar idiom; this module owns only data and filtering.
 */
import { appBasePath } from "@agent-native/core/client/api-path";
import {
  isWorkspaceAppEnvironment,
  parseWorkspaceAppLinks,
  type OrgSwitcherAppLink,
} from "@agent-native/core/client/org";
import { useEffect, useState } from "react";

export type WorkspaceAppLink = OrgSwitcherAppLink;

const LIST_APPS_PATH =
  "/_agent-native/actions/list-workspace-apps?includeAgentCards=false";

/** The current app's registry id, derived from its workspace mount path. */
export function currentWorkspaceAppId(): string {
  return appBasePath().replace(/^\//, "");
}

async function fetchWorkspaceAppLinks(): Promise<OrgSwitcherAppLink[] | null> {
  // list-workspace-apps is Dispatch's registry action, exposed at the gateway
  // ROOT by production deploy wrappers; the local dev gateway serves the same
  // list at /_workspace/apps instead (mirrors core's own OrgSwitcher sources).
  const urls = [LIST_APPS_PATH, "/_workspace/apps"];
  for (const url of new Set(urls)) {
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      if (!response.ok) continue;
      const payload = await response.json().catch(() => null);
      const links = parseWorkspaceAppLinks(payload);
      if (links?.length) return links;
    } catch {
      // Try the next source; an unreachable registry just hides the section.
    }
  }
  return null;
}

export interface UseWorkspaceAppLinksResult {
  /** Sibling apps, current app excluded, Dispatch last. */
  apps: WorkspaceAppLink[];
  isLoading: boolean;
}

export function useWorkspaceAppLinks(options?: {
  /** Registry id to exclude; defaults to the current app. */
  excludeAppId?: string;
}): UseWorkspaceAppLinksResult {
  const excludeAppId = options?.excludeAppId ?? currentWorkspaceAppId();
  const [apps, setApps] = useState<WorkspaceAppLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isWorkspaceAppEnvironment()) return;
    let cancelled = false;
    setIsLoading(true);
    void fetchWorkspaceAppLinks()
      .then((links) => {
        if (cancelled || !links) return;
        const visible = links
          // Skip the current app and transient scaffold entries the dev
          // gateway may still be caching (ids like ".agent-native-tmp-...").
          .filter((app) => app.id !== excludeAppId && !app.id.startsWith("."))
          .sort((a, b) =>
            a.isDispatch === b.isDispatch
              ? a.name.localeCompare(b.name)
              : a.isDispatch
                ? 1
                : -1,
          );
        setApps(visible);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [excludeAppId]);

  return { apps, isLoading };
}
