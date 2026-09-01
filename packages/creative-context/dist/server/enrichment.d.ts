export declare function projectCreativeContextMedia(mediaId: string): Promise<{
    mediaId: string;
    projected: false;
} | {
    mediaId: string;
    projected: true;
}>;
export declare function enrichCreativeContextMedia(input: {
    mediaId: string;
    paletteLimit?: number;
}): Promise<{
    mediaId: string;
    itemId: string;
    itemVersionId: string;
    versionAppended: boolean;
    palette: string[] | never[];
    caption: string | null;
    ocrText: string | null;
    contentHash: string;
    embeddingId: string | null;
    embeddingFamily: string | null;
    embeddingSkippedReason: string | null;
}>;
//# sourceMappingURL=enrichment.d.ts.map