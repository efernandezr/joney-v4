export declare const CREATIVE_CONTEXT_STATE_KEY = "creative-context";
export type CreativeContextMode = "auto" | "off";
export interface CreativeContextApplicationState {
    contextMode: CreativeContextMode;
    selectedContextId?: string | null;
    currentPackId?: string | null;
    pinnedPackId?: string | null;
}
export declare const DEFAULT_CREATIVE_CONTEXT_STATE: CreativeContextApplicationState;
export declare function normalizeCreativeContextState(value: unknown): CreativeContextApplicationState;
export declare function readCreativeContextState(options?: {
    signal?: AbortSignal;
}): Promise<CreativeContextApplicationState>;
export declare function setCreativeContextState(value: CreativeContextApplicationState): Promise<CreativeContextApplicationState>;
export declare function setCreativeContextMode(mode: CreativeContextMode, current?: CreativeContextApplicationState): Promise<CreativeContextApplicationState>;
export declare function setPinnedCreativeContextPack(packId: string | null, current?: CreativeContextApplicationState): Promise<CreativeContextApplicationState>;
export declare function setSelectedCreativeContext(contextId: string | null, current?: CreativeContextApplicationState): Promise<CreativeContextApplicationState>;
export declare function useCreativeContextState(): {
    state: CreativeContextApplicationState;
    setState: (next: CreativeContextApplicationState) => Promise<CreativeContextApplicationState>;
    isLoading: boolean;
    error: Error | null;
};
//# sourceMappingURL=application-state.d.ts.map