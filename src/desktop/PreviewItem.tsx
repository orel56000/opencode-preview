/** @jsxImportSource solid-js */
import { Show, type JSX } from "solid-js"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import type { PreviewSnapshot } from "../service/ipc.js"
import { statusColor, statusGlyph, statusLabel } from "./status.js"
import { buildUrl } from "../preview/ports.js"

export interface PreviewItemActions {
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onOpen: (id: string) => void
  onSelect: (id: string) => void
  busy: (id: string) => boolean
}

export function PreviewItem(props: {
  snapshot: PreviewSnapshot
  selected: boolean
  actions: PreviewItemActions
}): JSX.Element {
  const snapshot = () => props.snapshot
  const definition = () => snapshot().definition
  const url = () => snapshot().url ?? buildUrl(definition())
  const busy = () => props.actions.busy(definition().id)
  const running = () => snapshot().status === "running"

  return (
    <div
      role="button"
      tabindex={0}
      aria-label={`${definition().name}, ${statusLabel(snapshot().status)}`}
      class="flex flex-col gap-1 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2"
      data-selected={props.selected}
      onClick={() => props.actions.onSelect(definition().id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          props.actions.onSelect(definition().id)
        }
      }}
    >
      <div class="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" style={{ color: statusColor(snapshot().status) }}>
          {statusGlyph(snapshot().status)}
        </span>
        <span class="min-w-0 flex-1 truncate font-medium">{definition().name}</span>
        <span class="shrink-0 text-v2-text-text-muted">{statusLabel(snapshot().status)}</span>
      </div>
      <div class="truncate text-v2-text-text-muted">{url()}</div>
      <Show when={snapshot().error}>
        <div class="truncate text-v2-text-text-danger">{snapshot().error}</div>
      </Show>
      <div class="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
        <Show
          when={running()}
          fallback={
            <ButtonV2
              size="small"
              disabled={busy()}
              onClick={() => props.actions.onStart(definition().id)}
              aria-label={`Start ${definition().name}`}
            >
              Start
            </ButtonV2>
          }
        >
          <ButtonV2 size="small" onClick={() => props.actions.onOpen(definition().id)} aria-label={`Open ${definition().name}`}>
            Open
          </ButtonV2>
          <ButtonV2
            size="small"
            variant="secondary"
            disabled={busy()}
            onClick={() => props.actions.onRestart(definition().id)}
            aria-label={`Restart ${definition().name}`}
          >
            Restart
          </ButtonV2>
          <ButtonV2
            size="small"
            variant="ghost"
            disabled={busy()}
            onClick={() => props.actions.onStop(definition().id)}
            aria-label={`Stop ${definition().name}`}
          >
            Stop
          </ButtonV2>
        </Show>
      </div>
    </div>
  )
}
