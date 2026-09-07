export class RollingBuffer {
  private readonly maxLines: number
  private readonly onChange?: () => void
  private lines: string[] = []

  constructor(options: { maxLines: number; onChange?: () => void }) {
    this.maxLines = Math.max(1, options.maxLines)
    this.onChange = options.onChange
  }

  push(line: string): void {
    this.lines.push(line)
    if (this.lines.length > this.maxLines) {
      this.lines = this.lines.slice(-this.maxLines)
    }
    this.onChange?.()
  }

  getLines(): readonly string[] {
    return this.lines
  }

  clear(): void {
    this.lines = []
    this.onChange?.()
  }
}
