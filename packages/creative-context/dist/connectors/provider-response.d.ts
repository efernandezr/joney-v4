import type { ProviderApiRequestArgs, ProviderApiRuntime } from "@agent-native/core/provider-api";
export declare class ContextConnectorQuotaError extends Error {
    readonly provider: string;
    readonly retryAt: string;
    readonly retryAfterMs: number;
    constructor(input: {
        provider: string;
        retryAt: string;
        retryAfterMs?: number;
    });
}
export declare function isContextConnectorQuotaError(value: unknown): value is ContextConnectorQuotaError;
export declare function executeConnectorProviderRequest(runtime: Pick<ProviderApiRuntime, "executeRequest"> | undefined, args: ProviderApiRequestArgs): Promise<unknown>;
export declare function connectorConnectionId(provider: string, config: Record<string, unknown>, resolve?: (provider: string, requestedConnectionId?: string) => Promise<string | undefined>): Promise<string | undefined>;
export declare function asRecord(value: unknown): Record<string, unknown> | null;
export declare function stringValue(value: unknown): string | undefined;
export declare function stringArray(value: unknown): string[];
export declare function positiveLimit(value: unknown, fallback?: number, max?: number): number;
export declare function cursorOffset(cursor: string | null | undefined): number;
//# sourceMappingURL=provider-response.d.ts.map