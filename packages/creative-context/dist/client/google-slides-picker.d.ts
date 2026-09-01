declare global {
    interface Window {
        gapi?: any;
        google?: any;
        __creativeContextGooglePickerScript?: Promise<void>;
    }
}
export interface GoogleSlidesPickerSelection {
    externalId: string;
    title: string;
    canonicalUrl?: string;
}
export declare function googleSlidesPickerSelections(value: unknown): GoogleSlidesPickerSelection[];
export declare function chooseGoogleSlidesPresentations(input: {
    accessToken: string;
    apiKey: string;
    appId: string;
}): Promise<GoogleSlidesPickerSelection[]>;
//# sourceMappingURL=google-slides-picker.d.ts.map