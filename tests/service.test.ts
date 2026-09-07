import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PreviewService } from "../src/service/service.js"
import {
  createPreviewPreloadBridge,
  registerPreviewIpcMain,
  type PreviewIpcMain,
  type PreviewIpcRenderer,
} from "../src/service/preload.js"
import { PreviewIpcChannel } from "../src/service/ipc.js"
import { PreviewClient } from "../src/service/client.js"

function port(): number {
  return 54000 + Math.floor(Math.random() * 1000)
}

describe("preview service + typed IPC bridge", () => {
  let dir = ""
  let opened: string[] = []
  let service: PreviewService | undefined

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "opencode-preview-service-"))
    await mkdir(join(dir, ".opencode"), { recursive: true })
    opened = []
  })

  afterEach(async () => {
    await service?.dispose()
    service = undefined
    await rm(dir, { recursive: true, force: true })
  })

  it("starts/stops through the bridge and opens via the injected opener", async () => {
    const p = port()
    await writeFile(
      join(dir, ".opencode", "previews.json"),
      JSON.stringify({
        previews: [
          {
            id: "web",
            name: "Frontend",
            command: `node -e "require('http').createServer((req,res)=>res.end('ok')).listen(${p}, '127.0.0.1')"`,
            port: p,
          },
        ],
      }),
    )

    service = new PreviewService({ projectDirectory: dir, opener: (url) => void opened.push(url) })
    await service.init()

    // In-memory IPC bus emulating Electron's ipcMain/ipcRenderer.
    const handlers = new Map<string, (payload: unknown) => Promise<unknown>>()
    const listeners = new Map<string, Set<(payload: unknown) => void>>()
    const ipcMain: PreviewIpcMain = {
      handle: (channel, handler) => void handlers.set(channel, handler),
      removeHandler: (channel) => void handlers.delete(channel),
    }
    const ipcRenderer: PreviewIpcRenderer = {
      invoke: (channel, payload) => handlers.get(channel)?.(payload) as Promise<unknown>,
      on: (channel, listener) => {
        let set = listeners.get(channel)
        if (!set) {
          set = new Set()
          listeners.set(channel, set)
        }
        set.add(listener)
      },
      removeListener: (channel, listener) => void listeners.get(channel)?.delete(listener),
    }
    const unregister = registerPreviewIpcMain(ipcMain, {
      list: () => service!.list(),
      start: (id) => service!.start(id),
      stop: (id) => service!.stop(id),
      restart: (id) => service!.restart(id),
      open: (id) => service!.open(id),
      logs: (id, limit) => service!.logs(id, limit),
    })

    const bridge = createPreviewPreloadBridge(ipcRenderer)
    const client = new PreviewClient({ bridge, pollIntervalMs: 60_000 })

    assert.equal(await client.startPreview("web"), true)
    assert.equal(client.current().length, 0) // no push yet; refresh:
    await client.refresh()
    assert.equal(client.current()[0]?.status, "running")

    await client.openPreview("web")
    assert.match(opened[0] ?? "", new RegExp(`:${p}/`))

    const logs = await client.fetchLogs("web")
    assert.ok(Array.isArray(logs))

    await client.stopPreview("web")
    assert.equal(client.current()[0]?.status, "stopped")

    unregister()
    client.stop()
    void PreviewIpcChannel
  })

  it("validates IPC payloads and rejects unknown ids", async () => {
    const p = port()
    await writeFile(
      join(dir, ".opencode", "previews.json"),
      JSON.stringify({ previews: [] }),
    )
    service = new PreviewService({ projectDirectory: dir })
    await service.init()

    const handlers = new Map<string, (payload: unknown) => Promise<unknown>>()
    const unregister = registerPreviewIpcMain(
      {
        handle: (channel, handler) => void handlers.set(channel, handler),
        removeHandler: (channel) => void handlers.delete(channel),
      },
      {
        list: () => service!.list(),
        start: (id) => service!.start(id),
        stop: (id) => service!.stop(id),
        restart: (id) => service!.restart(id),
        open: (id) => service!.open(id),
        logs: (id, limit) => service!.logs(id, limit),
      },
    )

    const invoke = (channel: string, payload: unknown): Promise<unknown> => {
      const handler = handlers.get(channel)
      assert.ok(handler, `handler for ${channel} registered`)
      return handler(payload)
    }
    assert.equal(await invoke(PreviewIpcChannel.start, { id: "missing" }), false)
    await assert.rejects(() => invoke(PreviewIpcChannel.start, { id: "" }))
    await assert.rejects(() => invoke(PreviewIpcChannel.logs, { id: "x", limit: 99999 }))
    assert.deepEqual(await invoke(PreviewIpcChannel.list, {}), [])
    void p
    unregister()
  })
})
