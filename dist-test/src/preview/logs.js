export class RollingBuffer {
    maxLines;
    onChange;
    lines = [];
    constructor(options) {
        this.maxLines = Math.max(1, options.maxLines);
        this.onChange = options.onChange;
    }
    push(line) {
        this.lines.push(line);
        if (this.lines.length > this.maxLines) {
            this.lines = this.lines.slice(-this.maxLines);
        }
        this.onChange?.();
    }
    getLines() {
        return this.lines;
    }
    clear() {
        this.lines = [];
        this.onChange?.();
    }
}
//# sourceMappingURL=logs.js.map