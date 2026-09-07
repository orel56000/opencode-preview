import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { buildUrl, isPortInUse, isPortReachable } from "../src/preview/ports.js"
import { createServer } from "node:net"

describe("port utilities", () => {
  it("builds URL with defaults", () => {
    const url = buildUrl({
      id: "web",
      name: "Frontend",
      command: "npm run dev",
      port: 5173,
    })
    assert.equal(url, "http://localhost:5173/")
  })

  it("builds URL with custom host and path", () => {
    const url = buildUrl({
      id: "api",
      name: "API",
      command: "npm run dev",
      port: 3000,
      host: "0.0.0.0",
      path: "/v1",
    })
    assert.equal(url, "http://0.0.0.0:3000/v1")
  })

  it("reports available port as not in use", async () => {
    const inUse = await isPortInUse(54321)
    assert.equal(inUse, false)
  })

  it("reports occupied port as in use", async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(54322, "127.0.0.1", () => resolve()))
    try {
      const inUse = await isPortInUse(54322)
      assert.equal(inUse, true)
      const reachable = await isPortReachable("127.0.0.1", 54322)
      assert.equal(reachable, true)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
