const GOOGLE_SLIDES_DEFAULT_LIMIT = 15;
const RECENT_WINDOW_MONTHS = 12;
export function smartDefaultExternalIds(input) {
    if (input.kind !== "google-slides") {
        return input.items.map((item) => item.externalId);
    }
    const overrideIds = new Set([
        ...(input.canonicalExternalIds ?? []),
        ...(input.pinnedExternalIds ?? []),
    ]);
    const cutoff = new Date(input.now ?? new Date());
    cutoff.setUTCMonth(cutoff.getUTCMonth() - RECENT_WINDOW_MONTHS);
    return [...input.items]
        .filter((item) => {
        if (overrideIds.has(item.externalId))
            return true;
        if (isDraftLikeTitle(item.title))
            return false;
        const slideCount = knownSlideCount(item.metadata);
        if (slideCount !== null && slideCount < 3)
            return false;
        const modifiedAt = item.sourceModifiedAt
            ? Date.parse(item.sourceModifiedAt)
            : Number.NaN;
        return Number.isFinite(modifiedAt) && modifiedAt >= cutoff.getTime();
    })
        .sort((left, right) => {
        const leftOverride = overrideIds.has(left.externalId) ? 1 : 0;
        const rightOverride = overrideIds.has(right.externalId) ? 1 : 0;
        if (leftOverride !== rightOverride)
            return rightOverride - leftOverride;
        const leftShared = isSharedContainerItem(left) ? 1 : 0;
        const rightShared = isSharedContainerItem(right) ? 1 : 0;
        if (leftShared !== rightShared)
            return rightShared - leftShared;
        return modifiedTimestamp(right) - modifiedTimestamp(left);
    })
        .slice(0, GOOGLE_SLIDES_DEFAULT_LIMIT)
        .map((item) => item.externalId);
}
function isDraftLikeTitle(title) {
    return /^copy of\b/i.test(title.trim()) || /\btest\b/i.test(title);
}
function knownSlideCount(metadata) {
    for (const key of ["slideCount", "slidesCount", "pageCount"]) {
        const value = Number(metadata?.[key]);
        if (Number.isInteger(value) && value >= 0)
            return value;
    }
    return null;
}
function isSharedContainerItem(item) {
    const accessSignals = record(item.metadata?.accessSignals);
    return Boolean(accessSignals?.shared === true ||
        text(accessSignals?.driveId) ||
        text(item.metadata?.sharedDriveId));
}
function modifiedTimestamp(item) {
    const timestamp = item.sourceModifiedAt
        ? Date.parse(item.sourceModifiedAt)
        : Number.NaN;
    return Number.isFinite(timestamp) ? timestamp : 0;
}
function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
}
function text(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}
//# sourceMappingURL=smart-defaults.js.map