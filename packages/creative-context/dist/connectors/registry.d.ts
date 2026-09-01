import type { ContextImportConnector, ContextImportConnectorSummary } from "./types.js";
export declare class ContextImportConnectorRegistry {
    #private;
    constructor(connectors?: readonly ContextImportConnector[]);
    register(connector: ContextImportConnector): this;
    get(kind: string): ContextImportConnector;
    has(kind: string): boolean;
    list(): ContextImportConnectorSummary[];
}
//# sourceMappingURL=registry.d.ts.map