import { z } from "zod";
import type { CreativeContextElementProvenance, CreativeContextGenerationRecord, CreativeContextReuseLabel } from "../types.js";
import type { CreativeGenerationRole, ResolveGenerationCreativeContextInput } from "./generation-context.js";
declare const resolvedContextSchema: z.ZodObject<{
    contextMode: z.ZodEnum<{
        auto: "auto";
        off: "off";
        pinned: "pinned";
    }>;
    contextPackId: z.ZodNullable<z.ZodString>;
    reuseLabels: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        itemVersionId: z.ZodOptional<z.ZodString>;
        kind: z.ZodString;
        label: z.ZodString;
        dataRole: z.ZodLiteral<"untrusted-reference">;
        elementId: z.ZodOptional<z.ZodString>;
        influence: z.ZodOptional<z.ZodEnum<{
            adapted: "adapted";
            generated: "generated";
            "reference-conditioned": "reference-conditioned";
            reused: "reused";
        }>>;
    }, z.core.$strict>>;
    results: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        itemVersionId: z.ZodString;
        kind: z.ZodString;
        title: z.ZodString;
        excerpt: z.ZodString;
        dataRole: z.ZodLiteral<"untrusted-reference">;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const creativeContextA2ARequestSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    protocol: z.ZodLiteral<"creative-context-a2a-v1">;
    requestId: z.ZodUUID;
    operation: z.ZodLiteral<"resolve">;
    payload: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        role: z.ZodEnum<{
            analytics: "analytics";
            assets: "assets";
            content: "content";
            design: "design";
            slides: "slides";
        }>;
        limit: z.ZodOptional<z.ZodNumber>;
        contextPackId: z.ZodOptional<z.ZodString>;
        contextPackSource: z.ZodOptional<z.ZodEnum<{
            explicit: "explicit";
            inherited: "inherited";
        }>>;
        selectedContextId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    protocol: z.ZodLiteral<"creative-context-a2a-v1">;
    requestId: z.ZodUUID;
    operation: z.ZodLiteral<"validate">;
    payload: z.ZodObject<{
        contextPackId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contextPackSource: z.ZodOptional<z.ZodEnum<{
            explicit: "explicit";
            inherited: "inherited";
        }>>;
        reuseLabels: z.ZodOptional<z.ZodArray<z.ZodObject<{
            itemId: z.ZodOptional<z.ZodString>;
            itemVersionId: z.ZodOptional<z.ZodString>;
            kind: z.ZodString;
            label: z.ZodString;
            dataRole: z.ZodLiteral<"untrusted-reference">;
            elementId: z.ZodOptional<z.ZodString>;
            influence: z.ZodOptional<z.ZodEnum<{
                adapted: "adapted";
                generated: "generated";
                "reference-conditioned": "reference-conditioned";
                reused: "reused";
            }>>;
        }, z.core.$strict>>>;
        reuseLabelsSource: z.ZodOptional<z.ZodEnum<{
            explicit: "explicit";
            inherited: "inherited";
        }>>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    protocol: z.ZodLiteral<"creative-context-a2a-v1">;
    requestId: z.ZodUUID;
    operation: z.ZodLiteral<"read">;
    payload: z.ZodObject<{
        identity: z.ZodObject<{
            appId: z.ZodString;
            artifactType: z.ZodString;
            artifactId: z.ZodString;
        }, z.core.$strict>;
        artifactAccessCapability: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>, z.ZodObject<{
    protocol: z.ZodLiteral<"creative-context-a2a-v1">;
    requestId: z.ZodUUID;
    operation: z.ZodLiteral<"record">;
    payload: z.ZodObject<{
        appId: z.ZodString;
        artifactType: z.ZodString;
        artifactId: z.ZodString;
        contextMode: z.ZodEnum<{
            auto: "auto";
            off: "off";
            pinned: "pinned";
        }>;
        contextPackId: z.ZodNullable<z.ZodString>;
        reuseLabels: z.ZodArray<z.ZodObject<{
            itemId: z.ZodOptional<z.ZodString>;
            itemVersionId: z.ZodOptional<z.ZodString>;
            kind: z.ZodString;
            label: z.ZodString;
            dataRole: z.ZodLiteral<"untrusted-reference">;
            elementId: z.ZodOptional<z.ZodString>;
            influence: z.ZodOptional<z.ZodEnum<{
                adapted: "adapted";
                generated: "generated";
                "reference-conditioned": "reference-conditioned";
                reused: "reused";
            }>>;
        }, z.core.$strict>>;
        elementProvenance: z.ZodOptional<z.ZodArray<z.ZodObject<{
            elementId: z.ZodString;
            influence: z.ZodEnum<{
                adapted: "adapted";
                generated: "generated";
                "reference-conditioned": "reference-conditioned";
                reused: "reused";
            }>;
            itemId: z.ZodOptional<z.ZodString>;
            itemVersionId: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        artifactAccessCapability: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>], "operation">;
export type CreativeContextA2ARequest = z.infer<typeof creativeContextA2ARequestSchema>;
export type CreativeContextA2AOperation = CreativeContextA2ARequest["operation"];
type RemoteResultByOperation = {
    resolve: z.infer<typeof resolvedContextSchema>;
    validate: z.infer<typeof resolvedContextSchema>;
    read: CreativeContextGenerationRecord | null;
    record: CreativeContextGenerationRecord;
};
export declare function hasIsolatedCreativeContextA2A(): boolean;
export declare function decodeCreativeContextA2ARequest(requestToken: string): CreativeContextA2ARequest;
export declare function createCreativeContextA2AResponseToken(request: CreativeContextA2ARequest, result: unknown): string;
export declare function callIsolatedCreativeContextA2A<TOperation extends CreativeContextA2AOperation>(operation: TOperation, payload: Extract<CreativeContextA2ARequest, {
    operation: TOperation;
}>["payload"], options?: {
    callAgent?: typeof import("@agent-native/core/a2a").callAgent;
}): Promise<RemoteResultByOperation[TOperation]>;
export type IsolatedResolvePayload = {
    query?: string;
    role: CreativeGenerationRole;
    limit?: number;
    contextPackId?: string;
    contextPackSource?: "explicit" | "inherited";
    selectedContextId?: string | null;
};
export declare function isolatedResolvePayload(input: ResolveGenerationCreativeContextInput): IsolatedResolvePayload;
export type IsolatedRecordPayload = {
    appId: string;
    artifactType: string;
    artifactId: string;
    contextMode: "off" | "auto" | "pinned";
    contextPackId: string | null;
    reuseLabels: CreativeContextReuseLabel[];
    elementProvenance?: CreativeContextElementProvenance[];
    artifactAccessCapability?: string;
};
export {};
//# sourceMappingURL=isolated-a2a.d.ts.map