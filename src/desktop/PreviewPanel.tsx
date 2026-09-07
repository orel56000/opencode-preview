/** @jsxImportSource solid-js */
import { For, Show, createSignal, type JSX } from "solid-js"
import type { PreviewSnapshot } from "../service/ipc.js"
import { PreviewItem, type PreviewItemActions } from "./PreviewItem.js"
import { PreviewDetails } from "./PreviewDetails.js"

export interface PreviewPanelActions extends PreviewItemActions {
  onRefreshLogs: (id: string) => void
}

export function PreviewPanel(props: {
  snapshots: PreviewSnapshot[]
  logs: (id: string) => string[]
  actions: PreviewPanelActions
  onClose: () => void
}): JSX.Element {
  const [selectedId, setSelectedId] = createSignal<string | undefined>(undefined)
  const selected = () => props.snapshots.find((s) => s.definition.id === selectedId())

  const select = (id: string) => {
    setSelectedId((current) => (current === id ? undefined : id))
    props.actions.onRefreshLogs(id)
  }

  return (
    <section
      role="dialog"
      aria-label="Previews"
      class="flex max-h-[420px] w-[340px] min-h-0 flex-col gap-2 rounded-lg border p-3 shadow-lg"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          props.onClose()
        }
      }}
    >
      <div class="flex items-center gap-2">
        <h2 class="flex-1 text-sm font-semibold">Previews</h2>
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-v2-text-text-muted hover:bg-surface-base-hover"
          onClick={props.onClose}
          aria-label="Close previews"
        >
          ✕
        </button>
      </div>

      <Show
        when={props.snapshots.length > 0}
        fallback={
          <div class="flex flex-col gap-2 py-4 text-center">
            <p class="font-medium">No previews configured.</p>
            <p class="text-sm text-v2-text-text-muted">
              Your coding agent can register a preview when it creates a runnable application.
            </p>
          </div>
        }
      >
        <Show
          when={selected()}
          fallback={
            <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" role="list" aria-label="Preview list">
              <For each={props.snapshots}>
                {(snapshot) => (
                  <PreviewItem
                    snapshot={snapshot}
                    selected={selectedId() === snapshot.definition.id}
                    actions={{ ...props.actions, onSelect: select }}
                  />
                )}
              </For>
            </div>
          }
          keyed
        >
          {(snapshot: PreviewSnapshot) => (
            <PreviewDetails
              snapshot={snapshot}
              logs={props.logs(snapshot.definition.id)}
              onStart={props.actions.onStart}
              onStop={props.actions.onStop}
              onRestart={props.actions.onRestart}
              onOpen={props.actions.onOpen}
              onBack={() => setSelectedId(undefined)}
            />
          )}
        </Show>
      </Show>
    </section>
  )
}
