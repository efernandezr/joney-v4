export declare function nowIso(): string;
export declare function newId(prefix: string): string;
export declare function requireActor(): {
    ownerEmail: string;
    orgId: string | null;
};
export declare function parseJson<T>(value: string | null | undefined, fallback: T): T;
export declare function stringifyJson(value: unknown): string;
export declare function sha256(value: string): Promise<string>;
export declare function parseOffsetCursor(cursor: string | undefined): number;
export declare function nextOffsetCursor(offset: number, limit: number, hasMore: boolean): string | undefined;
//# sourceMappingURL=helpers.d.ts.map