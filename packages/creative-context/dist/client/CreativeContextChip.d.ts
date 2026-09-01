import type { ContextPackSummary } from "../types.js";
import { type CreativeContextSummary } from "./actions.js";
import type { CreativeContextApplicationState } from "./application-state.js";
export interface CreativeContextChipProps {
    state: CreativeContextApplicationState;
    packs?: ContextPackSummary[];
    contexts?: CreativeContextSummary[];
    className?: string;
}
export type CreativeContextChipSelection = "off" | "pinned-pack" | "selected-context" | "automatic";
export declare function resolveCreativeContextChipSelection(state: CreativeContextApplicationState): CreativeContextChipSelection;
export declare function hasCreativeContextConfiguration(packs: ReadonlyArray<Pick<ContextPackSummary, "memberCount">>, contexts: ReadonlyArray<Pick<CreativeContextSummary, "memberCount">>): boolean;
export declare function CreativeContextChip({ state, packs, contexts, className, }: CreativeContextChipProps): import("react").JSX.Element;
export declare function CreativeContextComposerChip({ href, className, }: {
    href?: string;
    className?: string;
}): import("react").JSX.Element | null;
//# sourceMappingURL=CreativeContextChip.d.ts.map