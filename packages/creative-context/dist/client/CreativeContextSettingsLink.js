import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useT } from "@agent-native/core/client/i18n";
import { IconArrowUpRight, IconBooks } from "@tabler/icons-react";
export function CreativeContextSettingsLink({ href = "/settings/library", }) {
    const t = useT();
    return (_jsxs("a", { id: "creative-context-library", href: href, className: "group flex scroll-mt-16 items-start gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/40", children: [_jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground", children: _jsx(IconBooks, { className: "size-4" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h2", { className: "text-base font-semibold", children: t("creativeContext.title") }), _jsx("p", { className: "mt-1 text-sm leading-6 text-muted-foreground", children: t("creativeContext.description") })] }), _jsx(IconArrowUpRight, { className: "mt-1 size-4 text-muted-foreground transition-colors group-hover:text-foreground" })] }));
}
//# sourceMappingURL=CreativeContextSettingsLink.js.map