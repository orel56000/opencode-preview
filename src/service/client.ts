import type { PreviewElectronBridge } from "./preload.js"
import type { PreviewSnapshot } from "./ipc.js"

export type PreviewClientOptions = {
  bridge: PreviewElectronBridge
  /** Fallback poll interval (ms) when push subscriptions are unavailable. */
  pollIntervalMs?: number
}

/**
 * Renderer-side client used by the Desktop SolidJS components.
 * Prefers push updates via `subscribe`, with polling as a fallback so the
 * panel stays live even if the host only implements request/response IPC.
 */
export class PreviewClient {
  private readonly bridge: PreviewElectronBridge
  private readonly pollIntervalMs: number
  private listeners = new Set<(snapshots: PreviewSnapshot[]) => void>()
  private snapshots: PreviewSnapshot[] = []
  private unsubscribe: (() => void) | undefined
  private pollTimer: ReturnType<typeof setInterval> | undefined
  private started = false

  constructor(options: PreviewClientOptions) {
    this.bridge = options.bridge
    this.pollIntervalMs = options.pollIntervalMs ?? 1500
  }

  current(): PreviewSnapshot[] {
    return this.snapshots
  }

  onChange(listener: (snapshots: PreviewSnapshot[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async start(): Promise<void> {
    if (this.started) return
    this.started = true
    try {
      this.unsubscribe = this.bridge.subscribe((snapshots) => this.setSnapshots(snapshots))
    } catch {
      this.unsubscribe = undefined
    }
    await this.refresh()
    this.pollTimer = setInterval(() => {
      void this.refresh()
    }, this.pollIntervalMs)
  }

  stop(): void {
    this.started = false
    this.unsubscribe?.()
    this.unsubscribe = undefined
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = undefined
    }
  }

  async refresh(): Promise<void> {
    const snapshots = await this.bridge.list()
    this.setSnapshots(snapshots)
  }

  startPreview(id: string): Promise<boolean> {
    return this.bridge.start(id)
  }

  async stopPreview(id: string): Promise<void> {
    await this.bridge.stop(id)
    await this.refresh()
  }

  restartPreview(id: string): Promise<boolean> {
    return this.bridge.restart(id)
  }

  openPreview(id: string): Promise<void> {
    return this.bridge.open(id)
  }

  fetchLogs(id: string, limit?: number): Promise<string[]> {
    return this.bridge.logs(id, limit)
  }

  private setSnapshots(snapshots: PreviewSnapshot[]): void {
    this.snapshots = snapshots
    for (const listener of this.listeners) {
      listener(snapshots)
    }
  }
}
