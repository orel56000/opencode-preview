import { PreviewManager } from "../preview/manager.js"
import type { UrlOpener } from "../preview/process.js"
import type { PreviewSnapshot } from "./ipc.js"
import type { PreviewRuntimeState } from "../types/index.js"

export type PreviewEvent =
  | { type: "snapshot"; snapshots: PreviewSnapshot[] }
  | { type: "log"; id: string; lines: string[] }

export interface PreviewServiceOptions {
  projectDirectory: string
  /** Electron hosts pass `shell.openExternal`. Defaults to the `open` package. */
  opener?: UrlOpener
  onEvent?: (event: PreviewEvent) => void
}

/**
 * Headless preview backend. Designed to live in the Electron **main**
 * process (or any Node/Bun host): it owns the PreviewManager, watches
 * `.opencode/previews.json`, and emits serializable snapshots/logs.
 *
 * The renderer never spawns processes — it talks to this service through
 * the typed IPC bridge (`preload.ts` / `client.ts`).
 */
export class PreviewService {
  private readonly manager: PreviewManager
  private readonly onEvent?: (event: PreviewEvent) => void
  private readonly seenLogLengths = new Map<string, number>()
  private notifyTimer: ReturnType<typeof setTimeout> | undefined
  private disposed = false

  constructor(options: PreviewServiceOptions) {
    this.onEvent = options.onEvent
    this.manager = new PreviewManager({
      projectDirectory: options.projectDirectory,
      opener: options.opener,
      onChange: () => this.scheduleNotify(),
    })
  }

  async init(): Promise<void> {
    await this.manager.loadConfig()
    this.manager.watchConfig()
    this.emitSnapshot()
  }

  list(): PreviewSnapshot[] {
    return this.manager.getInstances().map((instance) => toSnapshot(instance.getState()))
  }

  async start(id: string): Promise<boolean> {
    const ok = await this.manager.start(id)
    this.emitSnapshot()
    return ok
  }

  async stop(id: string): Promise<void> {
    await this.manager.stop(id)
    this.emitSnapshot()
  }

  async restart(id: string): Promise<boolean> {
    const ok = await this.manager.restart(id)
    this.emitSnapshot()
    return ok
  }

  async open(id: string): Promise<void> {
    await this.manager.open(id)
  }

  logs(id: string, limit = 500): string[] {
    const instance = this.manager.getInstance(id)
    if (!instance) return []
    const lines = instance.logs.getLines()
    return lines.slice(Math.max(0, lines.length - limit))
  }

  async reload(): Promise<void> {
    await this.manager.loadConfig()
    this.emitSnapshot()
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    if (this.notifyTimer) clearTimeout(this.notifyTimer)
    await this.manager.dispose()
  }

  private scheduleNotify(): void {
    if (this.disposed) return
    if (this.notifyTimer) return
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = undefined
      this.emitSnapshot()
    }, 50)
  }

  private emitSnapshot(): void {
    if (!this.onEvent) return
    const snapshots = this.list()
    this.onEvent({ type: "snapshot", snapshots })
    for (const snapshot of snapshots) {
      const instance = this.manager.getInstance(snapshot.definition.id)
      if (!instance) continue
      const lines = instance.logs.getLines()
      const seen = this.seenLogLengths.get(snapshot.definition.id) ?? 0
      if (lines.length > seen) {
        this.seenLogLengths.set(snapshot.definition.id, lines.length)
        this.onEvent({
          type: "log",
          id: snapshot.definition.id,
          lines: lines.slice(seen),
        })
      }
    }
  }
}

function toSnapshot(state: {
  definition: PreviewSnapshot["definition"]
  status: PreviewRuntimeState
  pid?: number
  url?: string
  uptimeMs?: number
  error?: string
}): PreviewSnapshot {
  const snapshot: PreviewSnapshot = {
    definition: state.definition,
    status: state.status,
  }
  if (state.pid !== undefined) snapshot.pid = state.pid
  if (state.url !== undefined) snapshot.url = state.url
  if (state.uptimeMs !== undefined) snapshot.uptimeMs = state.uptimeMs
  if (state.error !== undefined) snapshot.error = state.error
  return snapshot
}
