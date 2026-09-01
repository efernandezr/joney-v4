export declare function purgeContextSourceArtifacts(sourceId: string): Promise<{
    sourceId: string;
    purgedItems: number;
    purgedBlobs: number;
    demotedLayouts?: undefined;
    invalidatedBrandProfiles?: undefined;
    dnaRecomputeJobs?: undefined;
} | {
    sourceId: string;
    purgedItems: any;
    purgedBlobs: number;
    demotedLayouts: number;
    invalidatedBrandProfiles: number;
    dnaRecomputeJobs: number;
}>;
//# sourceMappingURL=purge.d.ts.map