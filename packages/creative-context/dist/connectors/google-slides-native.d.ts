import type { NativeCreativeArtifact } from "../native-artifact.js";
import type { ContextMediaInput } from "../types.js";
type JsonObject = Record<string, unknown>;
export interface SlidesNativeAssetRequest {
    sourceUrl: string;
    provenanceUrl?: string;
    presentationId: string;
    slideObjectId: string;
    elementObjectId: string;
    revisionId?: string;
    kind: "image" | "fallback";
    bounds: SlidesNativeBounds;
}
export interface SlidesNativeFallbackRequest {
    presentationId: string;
    slideObjectId: string;
    elementObjectId: string;
    revisionId?: string;
    bounds: SlidesNativeBounds;
    reason: string;
}
export interface SlidesNativeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface CompiledGoogleSlide {
    objectId: string;
    html: string;
    plainText: string;
    lexicalText: string;
    media: ContextMediaInput[];
    nativeArtifact: NativeCreativeArtifact;
    childArtifacts: CompiledGoogleSlideChild[];
}
export interface CompiledGoogleSlideChild {
    externalId: string;
    objectId: string;
    html: string;
    lexicalText: string;
    nativeArtifact: NativeCreativeArtifact;
}
export interface GoogleSlidesNativeCompileOptions {
    presentationId: string;
    revisionId?: string;
    resolveAsset: (request: SlidesNativeAssetRequest) => Promise<ContextMediaInput & {
        id: string;
        url: string;
    }>;
    resolveFallback?: (request: SlidesNativeFallbackRequest) => Promise<(ContextMediaInput & {
        id: string;
        url: string;
    }) | null>;
}
export declare function compileGoogleSlidesPresentation(presentation: JsonObject, options: GoogleSlidesNativeCompileOptions): Promise<CompiledGoogleSlide[]>;
export {};
//# sourceMappingURL=google-slides-native.d.ts.map