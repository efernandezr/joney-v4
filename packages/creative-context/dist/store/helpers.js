import { getRequestOrgId, getRequestUserEmail, } from "@agent-native/core/server/request-context";
export function nowIso() {
    return new Date().toISOString();
}
export function newId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}
export function requireActor() {
    const ownerEmail = getRequestUserEmail()?.trim().toLowerCase();
    if (!ownerEmail)
        throw new Error("Not authenticated");
    return { ownerEmail, orgId: getRequestOrgId() ?? null };
}
export function parseJson(value, fallback) {
    if (!value)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
export function stringifyJson(value) {
    return JSON.stringify(value ?? {});
}
export async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export function parseOffsetCursor(cursor) {
    if (!cursor)
        return 0;
    const parsed = Number.parseInt(cursor, 10);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}
export function nextOffsetCursor(offset, limit, hasMore) {
    return hasMore ? String(offset + limit) : undefined;
}
//# sourceMappingURL=helpers.js.map