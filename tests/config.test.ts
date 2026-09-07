import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { PreviewsConfigSchema } from "../src/config/schema.js"

describe("config validation", () => {
  it("accepts a valid config", () => {
    const result = PreviewsConfigSchema.safeParse({
      previews: [
        {
          id: "web",
          name: "Frontend",
          command: "npm run dev",
          cwd: ".",
          port: 5173,
          host: "localhost",
          path: "/",
          env: {},
          autoStart: false,
        },
      ],
    })
    assert.equal(result.success, true)
  })

  it("applies defaults", () => {
    const result = PreviewsConfigSchema.safeParse({
      previews: [
        {
          id: "api",
          name: "API",
          command: "npm run dev:api",
          port: 3000,
        },
      ],
    })
    assert.equal(result.success, true)
    if (!result.success) return
    const preview = result.data.previews[0]
    assert.equal(preview.host, "localhost")
    assert.equal(preview.path, "/")
    assert.equal(preview.cwd, ".")
    assert.deepEqual(preview.env, {})
    assert.equal(preview.autoStart, false)
  })

  it("normalizes path to start with /", () => {
    const result = PreviewsConfigSchema.safeParse({
      previews: [
        {
          id: "api",
          name: "API",
          command: "npm run dev",
          port: 3000,
          path: "foo",
        },
      ],
    })
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.data.previews[0].path, "/foo")
  })

  it("rejects duplicate ids", () => {
    const result = PreviewsConfigSchema.safeParse({
      previews: [
        { id: "web", name: "Frontend", command: "npm run dev", port: 5173 },
        { id: "web", name: "API", command: "npm run api", port: 3000 },
      ],
    })
    assert.equal(result.success, false)
  })

  it("rejects invalid ports", () => {
    const low = PreviewsConfigSchema.safeParse({
      previews: [
        { id: "web", name: "Frontend", command: "npm run dev", port: 0 },
      ],
    })
    const high = PreviewsConfigSchema.safeParse({
      previews: [
        { id: "web", name: "Frontend", command: "npm run dev", port: 70000 },
      ],
    })
    assert.equal(low.success, false)
    assert.equal(high.success, false)
  })

  it("rejects invalid ids", () => {
    const result = PreviewsConfigSchema.safeParse({
      previews: [
        { id: "web server", name: "Frontend", command: "npm run dev", port: 5173 },
      ],
    })
    assert.equal(result.success, false)
  })

  it("rejects malformed json via loader", async () => {
    const { loadPreviewsConfig } = await import("../src/config/loader.js")
    const { mkdir, writeFile } = await import("node:fs/promises")
    const { mkdtemp } = await import("node:fs/promises")
    const { tmpdir } = await import("node:os")
    const { join } = await import("node:path")

    const dir = await mkdtemp(join(tmpdir(), "opencode-preview-"))
    await mkdir(join(dir, ".opencode"), { recursive: true })
    await writeFile(join(dir, ".opencode/previews.json"), "not json", "utf-8")

    const result = await loadPreviewsConfig(dir)
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.match(result.error, /invalid JSON/)
  })
})
