import type { PreviewDefinition, PreviewState } from "../types/index.js";
import { RollingBuffer } from "./logs.js";
export interface PreviewInstanceOptions {
    definition: PreviewDefinition;
    projectDirectory: string;
    onChange?: () => void;
}
export declare class PreviewInstance {
    readonly definition: PreviewDefinition;
    private readonly projectDirectory;
    private readonly onChange?;
    private state;
    private child;
    private startTime;
    private stopPromise;
    readonly logs: RollingBuffer;
    constructor(options: PreviewInstanceOptions);
    getState(): PreviewState;
    start(): Promise<boolean>;
    stop(): Promise<void>;
    private doStop;
    restart(): Promise<boolean>;
    open(): Promise<void>;
    dispose(): Promise<void>;
    private setState;
    private killProcessTree;
}
//# sourceMappingURL=process.d.ts.map