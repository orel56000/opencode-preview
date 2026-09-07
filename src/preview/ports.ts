import { createConnection, createServer } from "node:net"
import type { PreviewDefinition } from "../types/index.js"

export function buildUrl(definition: PreviewDefinition): string {
  const host = definition.host ?? "localhost"
  const path = definition.path?.startsWith("/")
    ? definition.path
    : `/${definition.path ?? ""}`
  return `http://${host}:${definition.port}${path}`
}

export function isPortReachable(
  host: string,
  port: number,
  timeout = 1000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port })
    const timer = setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, timeout)

    socket.on("connect", () => {
      clearTimeout(timer)
      socket.end()
      resolve(true)
    })

    socket.on("error", () => {
      clearTimeout(timer)
      resolve(false)
    })
  })
}

export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    server.once("listening", () => {
      server.close(() => resolve(false))
    })
    server.listen(port, "127.0.0.1")
  })
}

export async function waitForPort(
  host: string,
  port: number,
  options: { timeout?: number; interval?: number } = {},
): Promise<boolean> {
  const timeout = options.timeout ?? 30_000
  const interval = options.interval ?? 250
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const reachable = await isPortReachable(host, port, interval)
    if (reachable) return true
    await sleep(interval)
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
