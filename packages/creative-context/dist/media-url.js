export const CREATIVE_CONTEXT_MEDIA_ROUTE = "/_agent-native/creative-context/media";
export function creativeContextMediaUrl(input) {
    if (!input.mediaId && !input.itemId) {
        throw new Error("mediaId or itemId is required");
    }
    const query = new URLSearchParams();
    if (input.mediaId)
        query.set("mediaId", input.mediaId);
    if (input.itemId)
        query.set("itemId", input.itemId);
    if (input.itemVersionId)
        query.set("itemVersionId", input.itemVersionId);
    return `${CREATIVE_CONTEXT_MEDIA_ROUTE}?${query}`;
}
//# sourceMappingURL=media-url.js.map