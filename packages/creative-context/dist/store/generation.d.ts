import { type GenerationArtifactAccessProof } from "../server/generation-artifact-access.js";
import type { CreativeContextGenerationRecord, CreativeContextElementProvenance, CreativeContextReuseLabel } from "../types.js";
export declare function assertGenerationCreativeContextInvariants(input: {
    contextMode: "off" | "auto" | "pinned";
    contextPackId: string | null;
    reuseLabels: readonly CreativeContextReuseLabel[];
    elementProvenance: readonly CreativeContextElementProvenance[];
}): void;
export declare function recordGenerationCreativeContext(input: {
    appId: string;
    artifactType: string;
    artifactId: string;
    contextMode: "off" | "auto" | "pinned";
    contextPackId: string | null;
    reuseLabels: CreativeContextReuseLabel[];
    elementProvenance?: CreativeContextElementProvenance[];
}, options?: {
    db?: any;
    artifactAccess?: GenerationArtifactAccessProof;
}): Promise<CreativeContextGenerationRecord>;
export declare function getGenerationCreativeContext(input: {
    appId: string;
    artifactType: string;
    artifactId: string;
}, options?: {
    artifactAccess?: GenerationArtifactAccessProof;
}): Promise<CreativeContextGenerationRecord | null>;
//# sourceMappingURL=generation.d.ts.map