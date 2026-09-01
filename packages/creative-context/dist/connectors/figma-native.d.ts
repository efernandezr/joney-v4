import { type FidelityEntry } from "@agent-native/core/ingestion";
import { type NativeCreativeArtifactFidelityReport } from "../native-artifact.js";
import type { NormalizedContextItem } from "../types.js";
import type { ContextConnectorExecutionContext } from "./types.js";
export declare const MAX_INLINE_NATIVE_CODE_BYTES: number;
export declare function fetchFigmaNativeContextItems(input: {
    fileKey: string;
    sourceTitle: string;
    sourceUrl: string;
    sourceModifiedAt?: string;
    connectionId?: string;
    context: ContextConnectorExecutionContext;
}): Promise<{
    items: NormalizedContextItem[];
    warnings: string[];
}>;
export declare function nativeFidelityReportFromEntries(entries: FidelityEntry[]): NativeCreativeArtifactFidelityReport;
//# sourceMappingURL=figma-native.d.ts.map