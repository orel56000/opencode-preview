import type { PreviewDefinition, PreviewsConfig } from "../types/index.js";
export interface LoadResult {
    ok: true;
    config: PreviewsConfig;
}
export interface LoadError {
    ok: false;
    error: string;
}
export type LoadPreviewsResult = LoadResult | LoadError;
export declare function getConfigPath(projectDirectory: string): string;
export declare function loadPreviewsConfig(projectDirectory: string): Promise<LoadPreviewsResult>;
export declare function savePreviewsConfig(projectDirectory: string, config: PreviewsConfig): Promise<void>;
export declare function registerPreview(projectDirectory: string, definition: PreviewDefinition): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
export declare function detectPreviews(projectDirectory: string): Promise<PreviewDefinition[]>;
//# sourceMappingURL=loader.d.ts.map