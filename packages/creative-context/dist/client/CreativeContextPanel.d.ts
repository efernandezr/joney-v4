import { type AgentPageScope } from "@agent-native/core/client/agent-chat";
import { type ReactNode } from "react";
import { type CreativeContextRootRecommendation } from "./actions.js";
type ConnectorKind = "google-slides" | "figma" | "notion" | "website" | "upload";
export interface UploadedContextFile {
    id: string;
    title: string;
    fileName: string;
    mimeType: string;
    url: string;
}
export interface CreativeContextPanelProps {
    scope?: AgentPageScope;
    canManageOrg?: boolean;
    scopeControl?: ReactNode;
    connectionsHref?: string;
}
export declare function parseFigmaRecommendationBoundary(reference: string): {
    figmaProjectId?: string;
    figmaTeamId?: string;
};
export declare function selectRenderableLayoutThumbnails<T extends {
    hasThumbnail: boolean;
}>(thumbnails: readonly T[]): T[];
export declare function mergeRecommendationSelection(current: ReadonlySet<string>, available: ReadonlySet<string>, previouslySeen: ReadonlySet<string>): Set<string>;
export declare function buildCreativeContextSourceConfig(kind: ConnectorKind, reference: string, uploadedFiles: UploadedContextFile[], recommendations?: CreativeContextRootRecommendation[]): {
    presentationIds: string[];
    rootPageIds?: undefined;
    rootPageUrls?: undefined;
    teamspaceRootPageIds?: undefined;
    teamspaceRootPageUrls?: undefined;
    urls?: undefined;
    items?: undefined;
} | {
    presentationIds?: undefined;
    fileUrls: string[];
    projectUrls: string[];
    teamUrls: string[];
    fileKeys?: string[] | undefined;
    rootPageIds?: undefined;
    rootPageUrls?: undefined;
    teamspaceRootPageIds?: undefined;
    teamspaceRootPageUrls?: undefined;
    urls?: undefined;
    items?: undefined;
} | {
    presentationIds?: undefined;
    rootPageIds: string[];
    rootPageUrls: string[];
    teamspaceRootPageIds: string[];
    teamspaceRootPageUrls: string[];
    urls?: undefined;
    items?: undefined;
} | {
    presentationIds?: undefined;
    rootPageIds?: undefined;
    rootPageUrls?: undefined;
    teamspaceRootPageIds?: undefined;
    teamspaceRootPageUrls?: undefined;
    urls: string[];
    items?: undefined;
} | {
    presentationIds?: undefined;
    rootPageIds?: undefined;
    rootPageUrls?: undefined;
    teamspaceRootPageIds?: undefined;
    teamspaceRootPageUrls?: undefined;
    urls?: undefined;
    items: UploadedContextFile[];
};
export declare function CreativeContextPanel({ scope, canManageOrg, scopeControl, connectionsHref, }: CreativeContextPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=CreativeContextPanel.d.ts.map