/** @jsxImportSource solid-js */
import { For, Show, type JSX } from "solid-js"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import type { PreviewSnapshot } from "../service/ipc.js"
import { formatUptime, statusColor, statusGlyph, statusLabel } from "./status.js"

export { formatUptime }

export function PreviewDetails(props: {
  snapshot: PreviewSnapshot
  logs: string[]
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onOpen: (id: string) => void
  onBack: () => void
}): JSX.Element {
  const snapshot = () => props.snapshot
  const definition = () => snapshot().definition

  return (
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <div class="flex items-center gap-2">
        <ButtonV2 size="small" variant="ghost" onClick={props.onBack} aria-label="Back to previews">
          ←
        </ButtonV2>
        <span class="min-w-0 flex-1 truncate font-semibold">{definition().name}</span>
        <span class="shrink-0" style={{ color: statusColor(snapshot().status) }}>
          {statusGlyph(snapshot().status)} {statusLabel(snapshot().status)}
        </span>
      </div>

      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt class="text-v2-text-text-muted">URL</dt>
        <dd class="truncate">{snapshot().url ?? "—"}</dd>
        <dt class="text-v2-text-text-muted">Port</dt>
        <dd>{definition().port}</dd>
        <Show when={snapshot().pid !== undefined}>
          <dt class="text-v2-text-text-muted">PID</dt>
          <dd>{snapshot().pid}</dd>
        </Show>
        <dt class="text-v2-text-text-muted">Uptime</dt>
        <dd>{formatUptime(snapshot().uptimeMs)}</dd>
        <dt class="text-v2-text-text-muted">Command</dt>
        <dd class="truncate">{definition().command}</dd>
      </dl>

      <div class="flex flex-wrap gap-1.5">
        <ButtonV2 size="small" onClick={() => props.onOpen(definition().id)} aria-label="Open in browser">
          Open
        </ButtonV2>
        <ButtonV2 size="small" variant="secondary" onClick={() => props.onRestart(definition().id)} aria-label="Restart preview">
          Restart
        </ButtonV2>
        <ButtonV2 size="small" variant="ghost" onClick={() => props.onStop(definition().id)} aria-label="Stop preview">
          Stop
        </ButtonV2>
      </div>

      <div class="text-v2-text-text-muted">Logs</div>
      <div
        role="log"
        aria-label={`${definition().name} logs`}
        class="min-h-24 flex-1 overflow-y-auto rounded-md border p-2 font-mono text-xs"
      >
        <Show when={props.logs.length > 0} fallback={<span class="text-v2-text-text-muted">No logs yet.</span>}>
          <For each={props.logs}>{(line) => <div class="select-text whitespace-pre-wrap break-all">{line}</div>}</For>
        </Show>
      </div>
    </div>
  )
}
