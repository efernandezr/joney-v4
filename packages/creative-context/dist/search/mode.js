import { matchesSearchMode, } from "@agent-native/core/search-utils";
export function shouldUsePostgresFts(matchMode) {
    return matchMode !== "regex";
}
export function matchesCreativeSearchMode(value, query, matchMode) {
    if (matchMode !== "phrase") {
        return matchesSearchMode(value, query, matchMode);
    }
    const normalizedValue = value.toLocaleLowerCase().replace(/\s+/g, " ");
    const normalizedQuery = query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    return Boolean(normalizedQuery) && normalizedValue.includes(normalizedQuery);
}
//# sourceMappingURL=mode.js.map