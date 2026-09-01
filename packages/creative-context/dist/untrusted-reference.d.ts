export declare const UNTRUSTED_REFERENCE_ROLE: "untrusted-reference";
export declare function sanitizeUntrustedReference(value: string): string;
export declare function delimitUntrustedReference(value: string): string;
export declare function delimitUntrustedMetadata(value: unknown): {
    dataRole: typeof UNTRUSTED_REFERENCE_ROLE;
    content: string;
};
//# sourceMappingURL=untrusted-reference.d.ts.map