import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useT } from "@agent-native/core/client/i18n";
import { Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, } from "@agent-native/toolkit/ui";
import { IconBrain, IconCheck, IconPin, IconSettings, } from "@tabler/icons-react";
import { parseCreativeContexts, useCreativeContexts, useCreativeContextPacks, } from "./actions.js";
import { useCreativeContextState } from "./application-state.js";
export function resolveCreativeContextChipSelection(state) {
    if (state.contextMode === "off")
        return "off";
    if (state.pinnedPackId)
        return "pinned-pack";
    if (state.selectedContextId)
        return "selected-context";
    return "automatic";
}
export function hasCreativeContextConfiguration(packs, contexts) {
    return (packs.some((pack) => pack.memberCount > 0) ||
        contexts.some((context) => context.memberCount > 0));
}
export function CreativeContextChip({ state, packs = [], contexts = [], className, }) {
    const t = useT();
    const packId = state.pinnedPackId ?? state.currentPackId;
    const pack = packs.find((candidate) => candidate.id === packId);
    const context = contexts.find((candidate) => candidate.id === state.selectedContextId);
    const selection = resolveCreativeContextChipSelection(state);
    const label = selection === "off"
        ? t("creativeContext.off")
        : selection === "pinned-pack"
            ? pack?.name || packId
            : selection === "selected-context"
                ? context?.name || state.selectedContextId
                : t("creativeContext.automatic");
    return (_jsxs(Badge, { variant: "outline", className: className, title: pack?.description ?? undefined, children: [state.pinnedPackId ? (_jsx(IconPin, { className: "me-1 size-3" })) : (_jsx(IconBrain, { className: "me-1 size-3" })), _jsx("span", { className: "max-w-44 truncate", children: label })] }));
}
export function CreativeContextComposerChip({ href = "/settings/library", className, }) {
    const t = useT();
    const contextState = useCreativeContextState();
    const packsQuery = useCreativeContextPacks();
    const contextsQuery = useCreativeContexts();
    const packs = packsQuery.data?.packs ?? [];
    const contexts = parseCreativeContexts(contextsQuery.data);
    if (!hasCreativeContextConfiguration(packs, contexts))
        return null;
    async function selectAutomatic() {
        await contextState.setState({
            ...contextState.state,
            contextMode: "auto",
            selectedContextId: null,
            pinnedPackId: null,
        });
    }
    async function selectOff() {
        await contextState.setState({
            contextMode: "off",
            selectedContextId: null,
            currentPackId: null,
            pinnedPackId: null,
        });
    }
    async function selectPack(packId) {
        await contextState.setState({
            ...contextState.state,
            contextMode: "auto",
            selectedContextId: null,
            pinnedPackId: packId,
        });
    }
    async function selectContext(contextId) {
        await contextState.setState({
            ...contextState.state,
            contextMode: "auto",
            selectedContextId: contextId,
            pinnedPackId: null,
        });
    }
    return (_jsx("div", { className: className ?? "px-3 pb-1", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "inline-flex max-w-full rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", children: _jsx(CreativeContextChip, { state: contextState.state, packs: packs, contexts: contexts, className: "max-w-full cursor-pointer bg-background/80" }) }) }), _jsxs(DropdownMenuContent, { align: "start", className: "w-64", children: [_jsx(DropdownMenuLabel, { children: t("creativeContext.modeLabel") }), _jsxs(DropdownMenuItem, { onSelect: () => void selectAutomatic(), children: [contextState.state.contextMode === "auto" &&
                                    !contextState.state.pinnedPackId &&
                                    !contextState.state.selectedContextId ? (_jsx(IconCheck, {})) : (_jsx(IconBrain, {})), t("creativeContext.automatic")] }), _jsxs(DropdownMenuItem, { onSelect: () => void selectOff(), children: [contextState.state.contextMode === "off" ? (_jsx(IconCheck, {})) : (_jsx(IconBrain, {})), t("creativeContext.off")] }), contexts.length ? (_jsxs(_Fragment, { children: [_jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuLabel, { children: "Contexts" }), contexts.slice(0, 8).map((context) => (_jsxs(DropdownMenuItem, { onSelect: () => void selectContext(context.id), children: [contextState.state.selectedContextId === context.id ? (_jsx(IconCheck, {})) : (_jsx(IconBrain, {})), _jsx("span", { className: "truncate", children: context.name })] }, context.id)))] })) : null, packs.length ? (_jsxs(DropdownMenuSub, { children: [_jsx(DropdownMenuSubTrigger, { children: "Advanced: pin an exact pack" }), _jsx(DropdownMenuSubContent, { className: "w-64", children: packs.slice(0, 8).map((pack) => (_jsxs(DropdownMenuItem, { onSelect: () => void selectPack(pack.id), children: [contextState.state.pinnedPackId === pack.id ? (_jsx(IconCheck, {})) : (_jsx(IconPin, {})), _jsx("span", { className: "truncate", children: pack.name })] }, pack.id))) })] })) : null, _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs("a", { href: href, children: [_jsx(IconSettings, {}), t("creativeContext.title")] }) })] })] }) }));
}
//# sourceMappingURL=CreativeContextChip.js.map