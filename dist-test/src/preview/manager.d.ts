import { PreviewInstance } from "./process.js";
export declare class PreviewManager {
    private readonly projectDirectory;
    private readonly onChange?;
    private instances;
    private configPath;
    private debounceTimer;
    private disposed;
    constructor(options: {
        projectDirectory: string;
        onChange?: () => void;
    });
    loadConfig(): Promise<void>;
    watchConfig(): void;
    unwatchConfig(): void;
    getInstances(): readonly PreviewInstance[];
    getInstance(id: string): PreviewInstance | undefined;
    start(id: string): Promise<boolean>;
    stop(id: string): Promise<void>;
    restart(id: string): Promise<boolean>;
    open(id: string): Promise<void>;
    dispose(): Promise<void>;
    private createInstance;
}
//# sourceMappingURL=manager.d.ts.map