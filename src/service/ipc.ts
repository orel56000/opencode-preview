import { z } from "zod"
import type { PreviewDefinition, PreviewRuntimeState } from "../types/index.js"

/** Channel names for the Electron main<->renderer preview bridge. */
export const PreviewIpcChannel = {
  list: "opencode-preview:list",
  start: "opencode-preview:start",
  stop: "opencode-preview:stop",
  restart: "opencode-preview:restart",
  open: "opencode-preview:open",
  logs: "opencode-preview:logs",
  subscribe: "opencode-preview:subscribe",
} as const

export type PreviewIpcChannelName =
  (typeof PreviewIpcChannel)[keyof typeof PreviewIpcChannel]

const PreviewIdSchema = z.object({ id: z.string().min(1).max(128) })

export const PreviewStartRequestSchema = PreviewIdSchema
export const PreviewStopRequestSchema = PreviewIdSchema
export const PreviewRestartRequestSchema = PreviewIdSchema
export const PreviewOpenRequestSchema = PreviewIdSchema
export const PreviewLogsRequestSchema = PreviewIdSchema.extend({
  limit: z.number().int().min(1).max(2000).optional(),
})

export type PreviewStartRequest = z.infer<typeof PreviewStartRequestSchema>
export type PreviewStopRequest = z.infer<typeof PreviewStopRequestSchema>
export type PreviewRestartRequest = z.infer<typeof PreviewRestartRequestSchema>
export type PreviewOpenRequest = z.infer<typeof PreviewOpenRequestSchema>
export type PreviewLogsRequest = z.infer<typeof PreviewLogsRequestSchema>

export const PreviewStatusSchema = z.enum([
  "stopped",
  "starting",
  "running",
  "stopping",
  "crashed",
  "port-in-use",
])

/** Serializable snapshot of one preview, safe to send over IPC. */
export const PreviewSnapshotSchema = z.object({
  definition: z.custom<PreviewDefinition>((value) => typeof value === "object" && value !== null),
  status: PreviewStatusSchema,
  pid: z.number().optional(),
  url: z.string().optional(),
  uptimeMs: z.number().optional(),
  error: z.string().optional(),
})

export type PreviewSnapshot = {
  definition: PreviewDefinition
  status: PreviewRuntimeState
  pid?: number
  url?: string
  uptimeMs?: number
  error?: string
}

export function parseIpcRequest<T>(schema: z.ZodType<T>, payload: unknown): T {
  return schema.parse(payload)
}
