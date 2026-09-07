import { tool } from "@opencode-ai/plugin";
import { loadPreviewsConfig, registerPreview, savePreviewsConfig, } from "../config/loader.js";
export function makePreviewTools(projectDirectory) {
    return {
        preview_register: tool({
            description: "Register or update a preview definition in the project's .opencode/previews.json config.",
            args: {
                id: tool.schema.string().describe("Unique preview id"),
                name: tool.schema.string().describe("Human-readable name"),
                command: tool.schema.string().describe("Shell command to run"),
                port: tool.schema.number().describe("TCP port the server listens on"),
                cwd: tool.schema.string().optional().describe("Working directory relative to project root"),
                path: tool.schema.string().optional().describe("URL path appended to the root"),
                autoStart: tool.schema.boolean().optional().describe("Start automatically when the project loads"),
            },
            execute: async (input) => {
                const result = await registerPreview(projectDirectory, {
                    id: input.id,
                    name: input.name,
                    command: input.command,
                    port: input.port,
                    cwd: input.cwd,
                    path: input.path,
                    autoStart: input.autoStart,
                });
                if (!result.ok) {
                    return { title: "preview_register failed", output: result.error };
                }
                return {
                    title: "Preview registered",
                    output: `Registered preview "${input.id}" on port ${input.port}.`,
                };
            },
        }),
        preview_list: tool({
            description: "List all preview definitions in the project.",
            args: {},
            execute: async () => {
                const loaded = await loadPreviewsConfig(projectDirectory);
                if (!loaded.ok) {
                    return { title: "preview_list failed", output: loaded.error };
                }
                return {
                    title: "Project previews",
                    output: JSON.stringify(loaded.config.previews, null, 2),
                };
            },
        }),
        preview_start: tool({
            description: "Enable auto-start for a registered preview.",
            args: {
                id: tool.schema.string().describe("Preview id"),
            },
            execute: async (input) => {
                const loaded = await loadPreviewsConfig(projectDirectory);
                if (!loaded.ok) {
                    return { title: "preview_start failed", output: loaded.error };
                }
                const preview = loaded.config.previews.find((p) => p.id === input.id);
                if (!preview) {
                    return { title: "preview_start failed", output: `No preview with id "${input.id}"` };
                }
                preview.autoStart = true;
                await savePreviewsConfig(projectDirectory, loaded.config);
                return {
                    title: "Auto-start enabled",
                    output: `Preview "${input.id}" is set to start automatically.`,
                };
            },
        }),
        preview_stop: tool({
            description: "Disable auto-start for a registered preview.",
            args: {
                id: tool.schema.string().describe("Preview id"),
            },
            execute: async (input) => {
                const loaded = await loadPreviewsConfig(projectDirectory);
                if (!loaded.ok) {
                    return { title: "preview_stop failed", output: loaded.error };
                }
                const preview = loaded.config.previews.find((p) => p.id === input.id);
                if (!preview) {
                    return { title: "preview_stop failed", output: `No preview with id "${input.id}"` };
                }
                preview.autoStart = false;
                await savePreviewsConfig(projectDirectory, loaded.config);
                return {
                    title: "Auto-start disabled",
                    output: `Preview "${input.id}" will not start automatically.`,
                };
            },
        }),
    };
}
//# sourceMappingURL=preview-tools.js.map