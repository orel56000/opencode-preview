import { createSignal } from "solid-js"
import type { PreviewClient } from "../service/client.js"
import type { PreviewSnapshot } from "../service/ipc.js"

export interface PreviewStore {
  snapshots: () => PreviewSnapshot[]
  logs: (id: string) => string[]
  busy: (id: string) => boolean
  start: (id: string) => Promise<void>
  stop: (id: string) => Promise<void>
  restart: (id: string) => Promise<void>
  open: (id: string) => Promise<void>
  refreshLogs: (id: string) => Promise<void>
}

/**
 * Reactive SolidJS store over a `PreviewClient`. Keeps a per-preview rolling
 * log cache (2000 lines max) fed on selection and on push events.
 */
export function createPreviewStore(client: PreviewClient): PreviewStore {
  const [snapshots, setSnapshots] = createSignal<PreviewSnapshot[]>(client.current())
  const [logCache, setLogCache] = createSignal<Record<string, string[]>>({})
  const [busyIds, setBusyIds] = createSignal<Record<string, boolean>>({})
  // First-seen Running timestamps so uptime ticks live between polls.
  const runningSince = new Map<string, number>()

  function withLiveUptime(next: PreviewSnapshot[]): PreviewSnapshot[] {
    const now = Date.now()
    for (const snapshot of next) {
      if (snapshot.status === "running") {
        if (!runningSince.has(snapshot.definition.id)) {
          runningSince.set(snapshot.definition.id, now - (snapshot.uptimeMs ?? 0))
        }
      } else {
        runningSince.delete(snapshot.definition.id)
      }
    }
    return next.map((snapshot) => {
      const since = runningSince.get(snapshot.definition.id)
      if (snapshot.status === "running" && since !== undefined) {
        return { ...snapshot, uptimeMs: Math.max(0, now - since) }
      }
      return snapshot
    })
  }

  client.onChange((next) => setSnapshots(withLiveUptime(next)))

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds((current) => ({ ...current, [id]: busy }))

  async function guard(id: string, action: () => Promise<unknown>): Promise<void> {
    if (busyIds()[id]) return
    setBusy(id, true)
    try {
      await action()
      await client.refresh()
      setSnapshots((current) => withLiveUptime(current))
    } finally {
      setBusy(id, false)
    }
  }

  return {
    snapshots,
    logs: (id: string) => logCache()[id] ?? [],
    busy: (id: string) => busyIds()[id] ?? false,
    start: (id: string) => guard(id, () => client.startPreview(id).then(() => undefined)),
    stop: (id: string) => guard(id, () => client.stopPreview(id)),
    restart: (id: string) => guard(id, () => client.restartPreview(id).then(() => undefined)),
    open: (id: string) => client.openPreview(id),
    refreshLogs: async (id: string) => {
      const lines = await client.fetchLogs(id, 500)
      setLogCache((current) => ({ ...current, [id]: lines.slice(-2000) }))
    },
  }
}
