export const UNTRUSTED_REFERENCE_ROLE = "untrusted-reference";
export function sanitizeUntrustedReference(value) {
    return value
        .replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
export function delimitUntrustedReference(value) {
    return `<<<UNTRUSTED_REFERENCE>>>\n${sanitizeUntrustedReference(value)}\n<<<END_UNTRUSTED_REFERENCE>>>`;
}
export function delimitUntrustedMetadata(value) {
    return {
        dataRole: UNTRUSTED_REFERENCE_ROLE,
        content: delimitUntrustedReference(JSON.stringify(value ?? null)),
    };
}
//# sourceMappingURL=untrusted-reference.js.map