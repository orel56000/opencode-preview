import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import {
  loadPreviewsConfig,
  registerPreview,
  removePreview,
  setAutoStart,
} from "../config/loader.js"

/**
 * Agent tools for managing project previews.
 *
 * Tools only read/write `.opencode/previews.json`. They never spawn or kill
 * processes directly: the UI runtime (TUI panel or Desktop service) watches
 * the config file and reconciles process state, so agent registrations appear
 * live without an OpenCode restart.
 */
export function makePreviewTools(
  projectDirectory: string,
): Record<string, ToolDefinition> {
  const idArg = { id: tool.schema.string().describe("Preview id") }
  return {
    preview_register: tool({
      description:
        "Register a preview (or update the definition when the id already exists) in .opencode/previews.json. Encouraged whenever you create a runnable web application.",
      args: {
        id: tool.schema.string().describe("Unique preview id (letters, numbers, -, _)"),
        name: tool.schema.string().describe("Human-readable name"),
        command: tool.schema.string().describe("Shell command to run"),
        port: tool.schema.number().describe("TCP port the server listens on"),
        cwd: tool.schema.string().optional().describe("Working directory relative to project root"),
        host: tool.schema.string().optional().describe("Host the server binds (default localhost)"),
        path: tool.schema.string().optional().describe("URL path appended to the root (default /)"),
        autoStart: tool.schema.boolean().optional().describe("Start automatically when the project loads"),
      },
      execute: async (input) => {
        const result = await registerPreview(projectDirectory, {
          id: input.id,
          name: input.name,
          command: input.command,
          port: input.port,
          cwd: input.cwd,
          host: input.host,
          path: input.path,
          autoStart: input.autoStart,
        })
        if (!result.ok) {
          return { title: "preview_register failed", output: result.error }
        }
        return {
          title: "Preview registered",
          output: `Registered preview "${input.id}" on port ${input.port}.`,
        }
      },
    }),

    preview_update: tool({
      description:
        "Update fields of an existing preview without touching unrelated definitions.",
      args: {
        ...idArg,
        name: tool.schema.string().optional().describe("Human-readable name"),
        command: tool.schema.string().optional().describe("Shell command to run"),
        port: tool.schema.number().optional().describe("TCP port the server listens on"),
        cwd: tool.schema.string().optional().describe("Working directory relative to project root"),
        host: tool.schema.string().optional().describe("Host the server binds"),
        path: tool.schema.string().optional().describe("URL path appended to the root"),
        autoStart: tool.schema.boolean().optional().describe("Start automatically when the project loads"),
      },
      execute: async (input) => {
        const loaded = await loadPreviewsConfig(projectDirectory)
        if (!loaded.ok) {
          return { title: "preview_update failed", output: loaded.error }
        }
        const preview = loaded.config.previews.find((p) => p.id === input.id)
        if (!preview) {
          return { title: "preview_update failed", output: `No preview with id "${input.id}"` }
        }
        for (const key of ["name", "command", "port", "cwd", "host", "path", "autoStart"] as const) {
          const value = input[key]
          if (value !== undefined) {
            (preview as unknown as Record<string, unknown>)[key] = value
          }
        }
        const result = await registerPreview(projectDirectory, preview)
        if (!result.ok) {
          return { title: "preview_update failed", output: result.error }
        }
        return { title: "Preview updated", output: `Updated preview "${input.id}".` }
      },
    }),

    preview_remove: tool({
      description: "Remove a preview definition from .opencode/previews.json.",
      args: { ...idArg },
      execute: async (input) => {
        const result = await removePreview(projectDirectory, input.id)
        if (!result.ok) {
          return { title: "preview_remove failed", output: result.error }
        }
        return { title: "Preview removed", output: `Removed preview "${input.id}".` }
      },
    }),

    preview_list: tool({
      description: "List all preview definitions in the project.",
      args: {},
      execute: async () => {
        const loaded = await loadPreviewsConfig(projectDirectory)
        if (!loaded.ok) {
          return { title: "preview_list failed", output: loaded.error }
        }
        return {
          title: "Project previews",
          output: JSON.stringify(loaded.config.previews, null, 2),
        }
      },
    }),

    preview_start: tool({
      description:
        "Request a preview to start by enabling auto-start. The UI runtime picks it up live via config watching.",
      args: { ...idArg },
      execute: async (input) => {
        const result = await setAutoStart(projectDirectory, input.id, true)
        if (!result.ok) {
          return { title: "preview_start failed", output: result.error }
        }
        return {
          title: "Preview start requested",
          output: `Preview "${input.id}" will start (auto-start enabled).`,
        }
      },
    }),

    preview_stop: tool({
      description:
        "Request a preview to stop by disabling auto-start. The UI runtime picks it up live via config watching.",
      args: { ...idArg },
      execute: async (input) => {
        const result = await setAutoStart(projectDirectory, input.id, false)
        if (!result.ok) {
          return { title: "preview_stop failed", output: result.error }
        }
        return {
          title: "Preview stop requested",
          output: `Preview "${input.id}" will stop (auto-start disabled).`,
        }
      },
    }),

    preview_restart: tool({
      description:
        "Request a preview to restart by ensuring auto-start is on. The UI runtime reloads the definition and restarts it.",
      args: { ...idArg },
      execute: async (input) => {
        const result = await setAutoStart(projectDirectory, input.id, true)
        if (!result.ok) {
          return { title: "preview_restart failed", output: result.error }
        }
        return {
          title: "Preview restart requested",
          output: `Preview "${input.id}" will restart.`,
        }
      },
    }),
  } as const
}
