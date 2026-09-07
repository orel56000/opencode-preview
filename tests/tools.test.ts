import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadPreviewsConfig } from "../src/config/loader.js"
import { makePreviewTools } from "../src/tools/preview-tools.js"

async function execute(
  tools: Record<string, { execute: (args: never, ctx: never) => Promise<unknown> }>,
  name: string,
  args: Record<string, unknown>,
): Promise<{ title?: string; output: string }> {
  const tool = tools[name]
  assert.ok(tool, `tool ${name} exists`)
  return (await tool.execute(args as never, {} as never)) as {
    title?: string
    output: string
  }
}

describe("preview agent tools", () => {
  let dir = ""

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "opencode-preview-tools-"))
    await mkdir(join(dir, ".opencode"), { recursive: true })
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it("registers, updates, lists and removes without touching siblings", async () => {
    const tools = makePreviewTools(dir) as unknown as Record<
      string,
      { execute: (args: never, ctx: never) => Promise<unknown> }
    >

    await execute(tools, "preview_register", {
      id: "web",
      name: "Frontend",
      command: "npm run dev",
      port: 5173,
    })
    await execute(tools, "preview_register", {
      id: "api",
      name: "API",
      command: "npm run dev:api",
      port: 3000,
    })

    const updated = await execute(tools, "preview_update", { id: "web", port: 5174 })
    assert.equal(updated.title, "Preview updated")

    const listed = await execute(tools, "preview_list", {})
    const previews = JSON.parse(listed.output) as Array<{ id: string; port: number }>
    assert.equal(previews.length, 2)
    assert.equal(previews.find((p) => p.id === "web")?.port, 5174)
    assert.equal(previews.find((p) => p.id === "api")?.port, 3000)

    const removed = await execute(tools, "preview_remove", { id: "api" })
    assert.equal(removed.title, "Preview removed")

    const loaded = await loadPreviewsConfig(dir)
    assert.equal(loaded.ok, true)
    if (loaded.ok) {
      assert.equal(loaded.config.previews.length, 1)
      assert.equal(loaded.config.previews[0]?.id, "web")
    }
  })

  it("start/stop/restart toggle autoStart and fail on unknown ids", async () => {
    const tools = makePreviewTools(dir) as unknown as Record<
      string,
      { execute: (args: never, ctx: never) => Promise<unknown> }
    >
    await execute(tools, "preview_register", {
      id: "web",
      name: "Frontend",
      command: "npm run dev",
      port: 5173,
    })

    assert.equal((await execute(tools, "preview_start", { id: "web" })).title, "Preview start requested")
    let loaded = await loadPreviewsConfig(dir)
    assert.equal(loaded.ok && loaded.config.previews[0]?.autoStart, true)

    assert.equal((await execute(tools, "preview_stop", { id: "web" })).title, "Preview stop requested")
    loaded = await loadPreviewsConfig(dir)
    assert.equal(loaded.ok && loaded.config.previews[0]?.autoStart, false)

    assert.equal(
      (await execute(tools, "preview_restart", { id: "web" })).title,
      "Preview restart requested",
    )
    assert.match((await execute(tools, "preview_stop", { id: "nope" })).output, /No preview/)
    assert.match((await execute(tools, "preview_update", { id: "nope" })).output, /No preview/)
  })
})
