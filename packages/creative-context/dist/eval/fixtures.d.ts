import type { RetrievalEvalTask } from "./index.js";
export interface CreativeContextGoldDocument {
    key: string;
    kind: "slide" | "figma-frame" | "notion-section" | "web-page" | "image";
    title: string;
    text: string;
    imageBase64?: string;
    owner: "personal" | "organization" | "other-organization";
    status: "active" | "deprecated";
    revisionOf?: string;
}
export declare const CREATIVE_CONTEXT_PURPLE_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGOI9n+JFTEMLQkAOpFkwUU6BmIAAAAASUVORK5CYII=";
export declare const CREATIVE_CONTEXT_INK_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGPg5hbAihiGlgQAtbUJgThTKnUAAAAASUVORK5CYII=";
export declare const CREATIVE_CONTEXT_GOLD_DOCUMENTS: readonly CreativeContextGoldDocument[];
export declare const CREATIVE_CONTEXT_GOLD_TASKS: readonly RetrievalEvalTask[];
//# sourceMappingURL=fixtures.d.ts.map