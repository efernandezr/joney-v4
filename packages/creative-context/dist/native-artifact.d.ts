import { z } from "zod";
declare const fidelityReportSchema: z.ZodObject<{
    exact: z.ZodObject<{
        count: z.ZodNumber;
    }, z.core.$strict>;
    approximated: z.ZodObject<{
        count: z.ZodNumber;
        reasons: z.ZodArray<z.ZodObject<{
            nodeId: z.ZodString;
            nodeName: z.ZodString;
            nodeType: z.ZodString;
            reasons: z.ZodArray<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    imageFallback: z.ZodObject<{
        count: z.ZodNumber;
        reasons: z.ZodArray<z.ZodObject<{
            nodeId: z.ZodString;
            nodeName: z.ZodString;
            nodeType: z.ZodString;
            reasons: z.ZodArray<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
export declare const nativeCreativeArtifactSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    app: z.ZodEnum<{
        design: "design";
        slides: "slides";
    }>;
    format: z.ZodEnum<{
        "design-html": "design-html";
        "slides-html": "slides-html";
    }>;
    rootExternalId: z.ZodString;
    sourceBounds: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strict>>;
    childExternalIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    manifest: z.ZodOptional<z.ZodObject<{
        kind: z.ZodLiteral<"hierarchical-artboard">;
        children: z.ZodArray<z.ZodObject<{
            externalId: z.ZodString;
            sourceNodeId: z.ZodString;
            bounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strict>;
            transform: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
            zOrder: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    fidelityReport: z.ZodObject<{
        exact: z.ZodObject<{
            count: z.ZodNumber;
        }, z.core.$strict>;
        approximated: z.ZodObject<{
            count: z.ZodNumber;
            reasons: z.ZodArray<z.ZodObject<{
                nodeId: z.ZodString;
                nodeName: z.ZodString;
                nodeType: z.ZodString;
                reasons: z.ZodArray<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>;
        imageFallback: z.ZodObject<{
            count: z.ZodNumber;
            reasons: z.ZodArray<z.ZodObject<{
                nodeId: z.ZodString;
                nodeName: z.ZodString;
                nodeType: z.ZodString;
                reasons: z.ZodArray<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>;
    }, z.core.$strict>;
    assetRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type NativeCreativeArtifact = z.infer<typeof nativeCreativeArtifactSchema>;
export type NativeCreativeArtifactFidelityReport = z.infer<typeof fidelityReportSchema>;
export declare function parseNativeCreativeArtifact(value: unknown): NativeCreativeArtifact;
export declare function nativeCreativeArtifactFromMetadata(metadata: unknown): NativeCreativeArtifact | null;
export {};
//# sourceMappingURL=native-artifact.d.ts.map