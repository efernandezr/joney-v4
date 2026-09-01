import { jsx as _jsx } from "react/jsx-runtime";
import { IconLibrary } from "@tabler/icons-react";
import { CreativeContextPanel } from "./CreativeContextPanel.js";
import { creativeContextMessagesByLocale } from "./messages.js";
function libraryLabel() {
    if (typeof document === "undefined") {
        return creativeContextMessagesByLocale["en-US"].title;
    }
    const locale = document.documentElement.lang;
    return (creativeContextMessagesByLocale[locale] ?? creativeContextMessagesByLocale["en-US"]).title;
}
export const createCreativeContextAgentTab = ({ scope, canManageOrg, scopeControl, }) => ({
    id: "library",
    label: libraryLabel(),
    icon: IconLibrary,
    group: "creative-context",
    keywords: "creative context library sources packs brand DNA reuse",
    searchEntries: [
        {
            id: "creative-context-sources",
            label: "Creative context sources",
            keywords: "references imports documents assets",
        },
        {
            id: "creative-context-packs",
            label: "Context packs",
            keywords: "generation provenance pinned",
        },
    ],
    content: (_jsx(CreativeContextPanel, { scope: scope, canManageOrg: canManageOrg, scopeControl: scopeControl })),
});
//# sourceMappingURL=agent-tab.js.map