import { type NativeCreativeArtifact } from "./native-artifact.js";
import type { ContextDetail } from "./types.js";
export interface NativeArtifactEvidence {
    itemId: string;
    itemVersionId: string;
}
export interface ReassembledNativeArtifact {
    html: string;
    artifact: NativeCreativeArtifact;
    evidence: NativeArtifactEvidence[];
}
export declare function reassembleNativeCreativeArtifact(input: {
    root: ContextDetail;
    app: NativeCreativeArtifact["app"];
    format: NativeCreativeArtifact["format"];
    resolveChild: (input: {
        sourceId: string;
        externalId: string;
        itemId?: string;
        itemVersionId?: string;
        sourceVersion?: string;
    }) => Promise<ContextDetail | null>;
}): Promise<ReassembledNativeArtifact>;
export declare function validateCompiledNativeHtml(html: string, artifact: NativeCreativeArtifact): void;
//# sourceMappingURL=native-artifact-reassembly.d.ts.map