import type { PreviewDefinition } from "../types/index.js";
export declare function buildUrl(definition: PreviewDefinition): string;
export declare function isPortReachable(host: string, port: number, timeout?: number): Promise<boolean>;
export declare function isPortInUse(port: number): Promise<boolean>;
export declare function waitForPort(host: string, port: number, options?: {
    timeout?: number;
    interval?: number;
}): Promise<boolean>;
//# sourceMappingURL=ports.d.ts.map