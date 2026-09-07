/** @jsxImportSource solid-js */
import { Show, createSignal, onCleanup, type JSX } from "solid-js"
import type { PreviewClient } from "../service/client.js"
import { createPreviewStore } from "./store.js"
import { PreviewButton } from "./PreviewButton.js"
import { PreviewPanel } from "./PreviewPanel.js"

/**
 * Drop-in host: renders `[ Preview ]` beside the context indicator and
 * opens the panel on click. The upstream patch mounts this in
 * `message-timeline.tsx` right after `<SessionContextUsage … />`.
 */
export function PreviewHost(props: { client: PreviewClient }): JSX.Element {
  const store = createPreviewStore(props.client)
  const [open, setOpen] = createSignal(false)

  void props.client.start()
  onCleanup(() => props.client.stop())

  return (
    <span class="relative inline-flex">
      <PreviewButton snapshots={store.snapshots()} open={open()} onToggle={() => setOpen((v) => !v)} />
      <Show when={open()}>
        <div class="absolute right-0 top-full z-50 mt-2">
          <PreviewPanel
            snapshots={store.snapshots()}
            logs={(id) => store.logs(id)}
            actions={{
              onStart: (id) => void store.start(id),
              onStop: (id) => void store.stop(id),
              onRestart: (id) => void store.restart(id),
              onOpen: (id) => void store.open(id),
              onSelect: () => {},
              onRefreshLogs: (id) => void store.refreshLogs(id),
              busy: (id) => store.busy(id),
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      </Show>
    </span>
  )
}
