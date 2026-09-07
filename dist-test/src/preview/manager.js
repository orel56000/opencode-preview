import { watchFile, unwatchFile } from "node:fs";
import { getConfigPath, loadPreviewsConfig } from "../config/loader.js";
import { PreviewInstance } from "./process.js";
export class PreviewManager {
    projectDirectory;
    onChange;
    instances = new Map();
    configPath;
    debounceTimer;
    disposed = false;
    constructor(options) {
        this.projectDirectory = options.projectDirectory;
        this.onChange = options.onChange;
        this.configPath = getConfigPath(options.projectDirectory);
    }
    async loadConfig() {
        if (this.disposed)
            return;
        const loaded = await loadPreviewsConfig(this.projectDirectory);
        if (!loaded.ok) {
            // Keep existing instances but surface error on the first one, or ignore.
            return;
        }
        const newDefinitions = new Map();
        for (const def of loaded.config.previews) {
            newDefinitions.set(def.id, def);
        }
        // Remove instances whose definitions disappeared, stopping them first.
        for (const [id, instance] of this.instances) {
            if (!newDefinitions.has(id)) {
                await instance.dispose();
                this.instances.delete(id);
            }
        }
        // Update definitions for existing instances and add new ones.
        for (const [id, definition] of newDefinitions) {
            const existing = this.instances.get(id);
            if (existing) {
                // We recreate the instance so the definition is current.
                // If it was running, stop the old one and let autoStart restart it.
                const wasRunning = existing.getState().status === "running";
                await existing.dispose();
                const instance = this.createInstance(definition);
                this.instances.set(id, instance);
                if (definition.autoStart && wasRunning) {
                    void instance.start();
                }
            }
            else {
                const instance = this.createInstance(definition);
                this.instances.set(id, instance);
                if (definition.autoStart) {
                    void instance.start();
                }
            }
        }
        this.onChange?.();
    }
    watchConfig() {
        if (this.disposed)
            return;
        watchFile(this.configPath, { interval: 1000 }, () => {
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                void this.loadConfig();
            }, 300);
        });
    }
    unwatchConfig() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
        try {
            unwatchFile(this.configPath);
        }
        catch {
            // ignore
        }
    }
    getInstances() {
        return Array.from(this.instances.values());
    }
    getInstance(id) {
        return this.instances.get(id);
    }
    async start(id) {
        const instance = this.instances.get(id);
        if (!instance)
            return false;
        return instance.start();
    }
    async stop(id) {
        const instance = this.instances.get(id);
        if (!instance)
            return;
        await instance.stop();
    }
    async restart(id) {
        const instance = this.instances.get(id);
        if (!instance)
            return false;
        return instance.restart();
    }
    async open(id) {
        const instance = this.instances.get(id);
        if (!instance)
            return;
        await instance.open();
    }
    async dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.unwatchConfig();
        for (const instance of this.instances.values()) {
            await instance.dispose();
        }
        this.instances.clear();
    }
    createInstance(definition) {
        return new PreviewInstance({
            definition,
            projectDirectory: this.projectDirectory,
            onChange: () => this.onChange?.(),
        });
    }
}
//# sourceMappingURL=manager.js.map