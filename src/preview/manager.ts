import { watchFile, unwatchFile } from "node:fs"
import { getConfigPath, loadPreviewsConfig } from "../config/loader.js"
import type { PreviewDefinition } from "../types/index.js"
import { PreviewInstance } from "./process.js"

export class PreviewManager {
  private readonly projectDirectory: string
  private readonly onChange?: () => void
  private instances = new Map<string, PreviewInstance>()
  private configPath: string
  private debounceTimer: ReturnType<typeof setTimeout> | undefined
  private disposed = false

  constructor(options: {
    projectDirectory: string
    onChange?: () => void
  }) {
    this.projectDirectory = options.projectDirectory
    this.onChange = options.onChange
    this.configPath = getConfigPath(options.projectDirectory)
  }

  async loadConfig(): Promise<void> {
    if (this.disposed) return

    const loaded = await loadPreviewsConfig(this.projectDirectory)
    if (!loaded.ok) {
      // Keep existing instances but surface error on the first one, or ignore.
      return
    }

    const newDefinitions = new Map<string, PreviewDefinition>()
    for (const def of loaded.config.previews) {
      newDefinitions.set(def.id, def)
    }

    // Remove instances whose definitions disappeared, stopping them first.
    for (const [id, instance] of this.instances) {
      if (!newDefinitions.has(id)) {
        await instance.dispose()
        this.instances.delete(id)
      }
    }

    // Update definitions for existing instances and add new ones.
    for (const [id, definition] of newDefinitions) {
      const existing = this.instances.get(id)
      if (existing) {
        // We recreate the instance so the definition is current.
        // If it was running, stop the old one and let autoStart restart it.
        const wasRunning = existing.getState().status === "running"
        await existing.dispose()
        const instance = this.createInstance(definition)
        this.instances.set(id, instance)
        if (definition.autoStart && wasRunning) {
          void instance.start()
        }
      } else {
        const instance = this.createInstance(definition)
        this.instances.set(id, instance)
        if (definition.autoStart) {
          void instance.start()
        }
      }
    }

    this.onChange?.()
  }

  watchConfig(): void {
    if (this.disposed) return
    watchFile(this.configPath, { interval: 1000 }, () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        void this.loadConfig()
      }, 300)
    })
  }

  unwatchConfig(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = undefined
    }
    try {
      unwatchFile(this.configPath)
    } catch {
      // ignore
    }
  }

  getInstances(): readonly PreviewInstance[] {
    return Array.from(this.instances.values())
  }

  getInstance(id: string): PreviewInstance | undefined {
    return this.instances.get(id)
  }

  async start(id: string): Promise<boolean> {
    const instance = this.instances.get(id)
    if (!instance) return false
    return instance.start()
  }

  async stop(id: string): Promise<void> {
    const instance = this.instances.get(id)
    if (!instance) return
    await instance.stop()
  }

  async restart(id: string): Promise<boolean> {
    const instance = this.instances.get(id)
    if (!instance) return false
    return instance.restart()
  }

  async open(id: string): Promise<void> {
    const instance = this.instances.get(id)
    if (!instance) return
    await instance.open()
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.unwatchConfig()
    for (const instance of this.instances.values()) {
      await instance.dispose()
    }
    this.instances.clear()
  }

  private createInstance(definition: PreviewDefinition): PreviewInstance {
    return new PreviewInstance({
      definition,
      projectDirectory: this.projectDirectory,
      onChange: () => this.onChange?.(),
    })
  }
}
