export declare class RollingBuffer {
    private readonly maxLines;
    private readonly onChange?;
    private lines;
    constructor(options: {
        maxLines: number;
        onChange?: () => void;
    });
    push(line: string): void;
    getLines(): readonly string[];
    clear(): void;
}
//# sourceMappingURL=logs.d.ts.map