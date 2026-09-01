import { type CreativeContextMembershipRank, type CreativeContextSummary } from "./actions.js";
export interface CreativeContextResourcePreview {
    kind?: "image" | "document" | "text";
    imageUrl?: string;
    alt?: string;
    label?: string;
}
export interface CreativeContextResourceDescriptor {
    appId: string;
    resourceType: string;
    resourceId: string;
    title: string;
    preview?: CreativeContextResourcePreview;
    updatedAt?: string;
    visibility?: "private" | "org" | "public";
}
export interface CreativeContextShareTabProps {
    resource?: CreativeContextResourceDescriptor;
    resources?: readonly CreativeContextResourceDescriptor[];
    canManage?: boolean;
    className?: string;
}
export declare function normalizeCreativeContextResources(resource?: CreativeContextResourceDescriptor, resources?: readonly CreativeContextResourceDescriptor[]): CreativeContextResourceDescriptor[];
export declare function requiresBroaderPublication(resource: CreativeContextResourceDescriptor, context: CreativeContextSummary | undefined): boolean;
export declare function creativeContextSafePreviewUrl(url: string | undefined): string | null;
export declare function submitCreativeContextResources({ contextId, resources, rank, purpose, note, confirmBroaderPublication, mutateAsync, }: {
    contextId: string;
    resources: readonly CreativeContextResourceDescriptor[];
    rank: CreativeContextMembershipRank;
    purpose?: string;
    note?: string;
    confirmBroaderPublication?: true;
    mutateAsync: (input: {
        operation: "submit";
        contextId: string;
        nativeResource: {
            appId: string;
            resourceType: string;
            resourceId: string;
            expectedUpdatedAt?: string;
        };
        rank: CreativeContextMembershipRank;
        purpose?: string;
        note?: string;
        confirmBroaderPublication?: true;
    }) => Promise<unknown>;
}): Promise<{
    submitted: number;
    failed: number;
}>;
export declare function CreativeContextShareTab({ resource, resources, className, }: CreativeContextShareTabProps): import("react").JSX.Element;
export declare function CreativeContextShareSheet({ resource, resources, open, onOpenChange, canManage, }: CreativeContextShareTabProps & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}): import("react").JSX.Element;
//# sourceMappingURL=CreativeContextShareTab.d.ts.map