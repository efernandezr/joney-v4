export interface SafeNativeHtmlPreviewInput {
    id: string;
    html: string;
    width: number;
    height: number;
}
export interface SafeNativeHtmlPreviewResult {
    id: string;
    data: Uint8Array;
    width: number;
    height: number;
}
export declare function sanitizeSafeNativePreviewHtml(html: string): string;
export declare function renderSafeNativeHtmlPreviews(inputs: SafeNativeHtmlPreviewInput[]): Promise<SafeNativeHtmlPreviewResult[]>;
//# sourceMappingURL=safe-native-preview.d.ts.map