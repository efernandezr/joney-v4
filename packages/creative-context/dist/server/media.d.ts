import { type NitroPluginDef } from "@agent-native/core/server";
export declare function createCreativeContextMediaPlugin(): NitroPluginDef;
export declare function readCreativeContextMedia(input: {
    mediaId?: string;
    itemId?: string;
    itemVersionId?: string;
}): Promise<{
    data: Uint8Array<ArrayBufferLike>;
    mimeType: string;
    itemId: string;
    itemVersionId: string;
    mediaId: string | null;
    media: import("../types.js").ContextMedia | null;
}>;
//# sourceMappingURL=media.d.ts.map