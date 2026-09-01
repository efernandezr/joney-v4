import type { ContextConnectorExecutionContext } from "./types.js";
export interface CreateContextConnectorExecutionContextOptions {
    appId: string;
    ownerEmail?: string;
    signal?: AbortSignal;
}
export declare function createDefaultContextConnectorExecutionContext(options: CreateContextConnectorExecutionContextOptions): ContextConnectorExecutionContext;
export declare function createWorkspaceConnectionResolver(appId: string): (provider: string, requestedConnectionId?: string) => Promise<string | undefined>;
//# sourceMappingURL=context.d.ts.map