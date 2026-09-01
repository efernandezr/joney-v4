import { type SearchMatchMode } from "@agent-native/core/search-utils";
export declare function shouldUsePostgresFts(matchMode: SearchMatchMode | undefined): matchMode is "allTerms" | "anyTerm" | "phrase" | undefined;
export declare function matchesCreativeSearchMode(value: string, query: string, matchMode: SearchMatchMode): boolean;
//# sourceMappingURL=mode.d.ts.map