import { getBrowserTabId, readClientAppState, setClientAppState, useChangeVersion, } from "@agent-native/core/client/hooks";
import { useCallback, useEffect, useState } from "react";
export const CREATIVE_CONTEXT_STATE_KEY = "creative-context";
export const DEFAULT_CREATIVE_CONTEXT_STATE = {
    contextMode: "auto",
    selectedContextId: null,
    currentPackId: null,
    pinnedPackId: null,
};
function normalizePackId(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}
export function normalizeCreativeContextState(value) {
    if (!value || typeof value !== "object") {
        return { ...DEFAULT_CREATIVE_CONTEXT_STATE };
    }
    const record = value;
    const contextMode = record.contextMode === "off" ? "off" : "auto";
    if (contextMode === "off") {
        return {
            contextMode,
            selectedContextId: null,
            currentPackId: null,
            pinnedPackId: null,
        };
    }
    return {
        contextMode,
        selectedContextId: normalizePackId(record.selectedContextId),
        currentPackId: normalizePackId(record.currentPackId),
        pinnedPackId: normalizePackId(record.pinnedPackId),
    };
}
export async function readCreativeContextState(options) {
    const value = await readClientAppState(CREATIVE_CONTEXT_STATE_KEY, options);
    return normalizeCreativeContextState(value);
}
export async function setCreativeContextState(value) {
    const normalized = normalizeCreativeContextState(value);
    await setClientAppState(CREATIVE_CONTEXT_STATE_KEY, normalized, {
        requestSource: getBrowserTabId(),
    });
    return normalized;
}
export async function setCreativeContextMode(mode, current) {
    const state = current ?? (await readCreativeContextState());
    return setCreativeContextState(mode === "off"
        ? {
            contextMode: "off",
            selectedContextId: null,
            currentPackId: null,
            pinnedPackId: null,
        }
        : {
            ...state,
            contextMode: "auto",
            selectedContextId: null,
            pinnedPackId: null,
        });
}
export async function setPinnedCreativeContextPack(packId, current) {
    const state = current ?? (await readCreativeContextState());
    return setCreativeContextState({
        ...state,
        contextMode: "auto",
        selectedContextId: null,
        pinnedPackId: normalizePackId(packId),
    });
}
export async function setSelectedCreativeContext(contextId, current) {
    const state = current ?? (await readCreativeContextState());
    return setCreativeContextState({
        ...state,
        contextMode: "auto",
        selectedContextId: normalizePackId(contextId),
        pinnedPackId: null,
    });
}
export function useCreativeContextState() {
    const appStateVersion = useChangeVersion("app-state");
    const [state, setState] = useState(DEFAULT_CREATIVE_CONTEXT_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        readCreativeContextState({ signal: controller.signal })
            .then((next) => {
            setState(next);
            setError(null);
        })
            .catch((cause) => {
            if (controller.signal.aborted)
                return;
            setError(cause instanceof Error ? cause : new Error(String(cause)));
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [appStateVersion]);
    const save = useCallback(async (next) => {
        const saved = await setCreativeContextState(next);
        setState(saved);
        setError(null);
        return saved;
    }, []);
    return { state, setState: save, isLoading, error };
}
//# sourceMappingURL=application-state.js.map