export declare function creativeContextConnectionPath(input: {
    provider: "google_drive" | "figma" | "notion";
    appId: string;
}): string;
declare const _default: import("@agent-native/core/action").ActionDefinition<{
    provider: "figma" | "google_drive" | "notion";
}, {
    appId: string;
    provider: "figma" | "google_drive" | "notion";
    connections: {
        connectionId: string;
        provider: string;
        label: string;
    }[];
    autoSelectedConnectionId: string | null;
    needsPicker: boolean;
    needsSetup: boolean;
    connectionsPath: string;
    connectPath: string;
}>;
export default _default;
//# sourceMappingURL=list-context-connections.d.ts.map