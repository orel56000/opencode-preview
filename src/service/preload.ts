import {
  PreviewIpcChannel,
  PreviewLogsRequestSchema,
  PreviewOpenRequestSchema,
  PreviewRestartRequestSchema,
  PreviewStartRequestSchema,
  PreviewStopRequestSchema,
  type PreviewSnapshot,
} from "./ipc.js"

/**
 * Minimal Electron IPC surface needed by the preview bridge.
 * Uses structural typing so it works with the real `ipcRenderer`
 * without importing `electron` in this package.
 */
export interface PreviewIpcRenderer {
  invoke(channel: string, payload?: unknown): Promise<unknown>
  on(channel: string, listener: (payload: unknown) => void): void
  removeListener(channel: string, listener: (payload: unknown) => void): void
}

export interface PreviewElectronBridge {
  list: () => Promise<PreviewSnapshot[]>
  start: (id: string) => Promise<boolean>
  stop: (id: string) => Promise<void>
  restart: (id: string) => Promise<boolean>
  open: (id: string) => Promise<void>
  logs: (id: string, limit?: number) => Promise<string[]>
  subscribe: (listener: (snapshots: PreviewSnapshot[]) => void) => () => void
}

type IpcMainHandler = (payload: unknown) => Promise<unknown>

export interface PreviewIpcMain {
  handle(channel: string, handler: IpcMainHandler): void
  removeHandler(channel: string): void
}

export interface PreviewEventSender {
  send(channel: string, payload: unknown): void
}

export interface RegisterPreviewIpcOptions {
  list: () => PreviewSnapshot[] | Promise<PreviewSnapshot[]>
  start: (id: string) => boolean | Promise<boolean>
  stop: (id: string) => void | Promise<void>
  restart: (id: string) => boolean | Promise<boolean>
  open: (id: string) => void | Promise<void>
  logs: (id: string, limit?: number) => string[] | Promise<string[]>
}

/**
 * Register typed `ipcMain.handle` endpoints in the Electron **main**
 * process. Wire these to a `PreviewService` instance.
 */
export function registerPreviewIpcMain(
  ipcMain: PreviewIpcMain,
  handlers: RegisterPreviewIpcOptions,
): () => void {
  const registrations: Array<[string, IpcMainHandler]> = [
    [PreviewIpcChannel.list, async () => handlers.list()],
    [
      PreviewIpcChannel.start,
      async (payload) => handlers.start(PreviewStartRequestSchema.parse(payload).id),
    ],
    [
      PreviewIpcChannel.stop,
      async (payload) => {
        await handlers.stop(PreviewStopRequestSchema.parse(payload).id)
      },
    ],
    [
      PreviewIpcChannel.restart,
      async (payload) => handlers.restart(PreviewRestartRequestSchema.parse(payload).id),
    ],
    [
      PreviewIpcChannel.open,
      async (payload) => {
        await handlers.open(PreviewOpenRequestSchema.parse(payload).id)
      },
    ],
    [
      PreviewIpcChannel.logs,
      async (payload) => {
        const request = PreviewLogsRequestSchema.parse(payload)
        return handlers.logs(request.id, request.limit)
      },
    ],
  ]
  for (const [channel, handler] of registrations) {
    ipcMain.handle(channel, handler)
  }
  return () => {
    for (const [channel] of registrations) {
      ipcMain.removeHandler(channel)
    }
  }
}

/**
 * Build the renderer-facing bridge (exposed via `contextBridge` in the
 * real preload script) from an `ipcRenderer`.
 */
export function createPreviewPreloadBridge(
  ipcRenderer: PreviewIpcRenderer,
): PreviewElectronBridge {
  return {
    list: () => ipcRenderer.invoke(PreviewIpcChannel.list) as Promise<PreviewSnapshot[]>,
    start: (id: string) =>
      ipcRenderer.invoke(
        PreviewIpcChannel.start,
        PreviewStartRequestSchema.parse({ id }),
      ) as Promise<boolean>,
    stop: (id: string) =>
      (ipcRenderer.invoke(
        PreviewIpcChannel.stop,
        PreviewStopRequestSchema.parse({ id }),
      ) as Promise<unknown>).then(() => undefined),
    restart: (id: string) =>
      ipcRenderer.invoke(
        PreviewIpcChannel.restart,
        PreviewRestartRequestSchema.parse({ id }),
      ) as Promise<boolean>,
    open: (id: string) =>
      (ipcRenderer.invoke(
        PreviewIpcChannel.open,
        PreviewOpenRequestSchema.parse({ id }),
      ) as Promise<unknown>).then(() => undefined),
    logs: (id: string, limit?: number) =>
      ipcRenderer.invoke(
        PreviewIpcChannel.logs,
        PreviewLogsRequestSchema.parse({ id, limit }),
      ) as Promise<string[]>,
    subscribe: (listener) => {
      const wrapped = (payload: unknown) => {
        listener(payload as PreviewSnapshot[])
      }
      ipcRenderer.on(PreviewIpcChannel.subscribe, wrapped)
      return () => ipcRenderer.removeListener(PreviewIpcChannel.subscribe, wrapped)
    },
  }
}
