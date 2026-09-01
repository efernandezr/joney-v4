declare const _default: import("@agent-native/core/action").ActionDefinition<{
    operation: "submit";
    contextId: string;
    itemId?: string | undefined;
    itemVersionId?: string | undefined;
    nativeResource?: {
        appId: string;
        resourceType: string;
        resourceId: string;
        expectedUpdatedAt?: string | undefined;
    } | undefined;
    note?: string | undefined;
    rank?: "canonical" | "exemplar" | "normal" | undefined;
    purpose?: string | undefined;
    confirmBroaderPublication?: boolean | undefined;
} | {
    operation: "submit-latest";
    contextId: string;
    membershipId: string;
    note?: string | undefined;
    confirmBroaderPublication?: boolean | undefined;
} | {
    operation: "approve" | "remove" | "request-changes" | "withdraw";
    contextId: string;
    membershipId: string;
    note?: string | undefined;
}, {
    membershipId: any;
    submission: import("../types.js").CreativeContextSubmissionSummary;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership: import("../types.js").CreativeContextMembership;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn: boolean;
    requestChanges?: undefined;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges: boolean;
    approved?: undefined;
} | {
    membershipId?: undefined;
    submission?: undefined;
    membership?: undefined;
    withdrawn?: undefined;
    requestChanges?: undefined;
    approved: boolean;
}>;
export default _default;
//# sourceMappingURL=manage-context-membership.d.ts.map