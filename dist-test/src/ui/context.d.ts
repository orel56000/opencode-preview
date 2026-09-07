import type { TuiPluginApi } from "@opencode-ai/plugin/tui";
import type { PreviewManager } from "../preview/manager.js";
export interface PreviewContextValue {
    manager: PreviewManager;
    api: TuiPluginApi;
}
export declare const PreviewContext: import("solid-js").Context<PreviewContextValue | undefined>;
export declare function usePreview(): PreviewContextValue;
//# sourceMappingURL=context.d.ts.map