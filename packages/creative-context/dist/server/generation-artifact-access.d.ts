export interface GenerationArtifactIdentity {
    appId: string;
    artifactType: string;
    artifactId: string;
}
export interface GenerationArtifactAccessTarget {
    resourceType: string;
    resourceId: string;
}
declare const proofBrand: unique symbol;
export interface GenerationArtifactAccessProof {
    readonly identityKey: string;
    readonly minRole: "viewer" | "editor";
    readonly [proofBrand]: true;
}
export declare function assertGenerationArtifactAccess(identity: GenerationArtifactIdentity, target: GenerationArtifactAccessTarget, minRole: "viewer" | "editor"): Promise<GenerationArtifactAccessProof>;
export declare function assertGenerationArtifactAccessProof(identity: GenerationArtifactIdentity, proof: GenerationArtifactAccessProof, minRole: "viewer" | "editor"): void;
export declare function createGenerationArtifactAccessCapability(identity: GenerationArtifactIdentity, target: GenerationArtifactAccessTarget, operation: "read" | "record"): Promise<string>;
export declare function verifyGenerationArtifactAccessCapability(token: string, identity: GenerationArtifactIdentity, operation: "read" | "record"): Promise<GenerationArtifactAccessProof>;
export {};
//# sourceMappingURL=generation-artifact-access.d.ts.map