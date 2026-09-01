import { type AgentPageScope } from "@agent-native/core/client/agent-chat";
import { type SettingsTabItem } from "@agent-native/core/client/settings";
import type { ReactNode } from "react";
export type CreativeContextAgentTabFactory = (context: {
    scope: AgentPageScope;
    canManageOrg?: boolean;
    scopeControl: ReactNode;
}) => SettingsTabItem;
export declare const createCreativeContextAgentTab: CreativeContextAgentTabFactory;
//# sourceMappingURL=agent-tab.d.ts.map