import type { ContextConnectorInventoryItem, ContextConnectorKind } from "./types.js";
export declare function smartDefaultExternalIds(input: {
    kind: ContextConnectorKind | (string & {});
    items: ContextConnectorInventoryItem[];
    canonicalExternalIds?: string[];
    pinnedExternalIds?: string[];
    now?: Date;
}): string[];
//# sourceMappingURL=smart-defaults.d.ts.map