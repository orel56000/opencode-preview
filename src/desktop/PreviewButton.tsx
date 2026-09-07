/** @jsxImportSource solid-js */
import { Show, type JSX } from "solid-js"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"
import { Icon } from "@opencode-ai/ui/v2/icon"
import type { PreviewSnapshot } from "../service/ipc.js"
import { aggregateStatus, previewTooltip, runningCount } from "./status.js"

export interface PreviewButtonProps {
  snapshots: PreviewSnapshot[]
  open: boolean
  onToggle: () => void
  placement?: "top" | "bottom"
}

/**
 * Preview toolbar button. Sits directly beside the circular context-window
 * indicator and shares its sizing, tooltip style and focus behavior.
 *
 * - gray dot: no previews running
 * - green dot: ≥1 preview running
 * - yellow dot: starting/stopping
 * - red dot: crashed / port-in-use
 */
export function PreviewButton(props: PreviewButtonProps): JSX.Element {
  const aggregate = () => aggregateStatus(props.snapshots)
  const dotColor = () => {
    switch (aggregate()) {
      case "active":
        return "var(--v2-icon-icon-success, #22c55e)"
      case "starting":
        return "var(--v2-icon-icon-warning, #eab308)"
      case "error":
        return "var(--v2-icon-icon-danger, #ef4444)"
      case "idle":
        return "transparent"
    }
  }

  return (
    <TooltipV2 value={previewTooltip(props.snapshots)} placement={props.placement ?? "bottom"} shift={-8}>
      <span class="relative inline-flex">
        <IconButtonV2
          type="button"
          variant="ghost-muted"
          size="large"
          icon={<Icon name="monitor" />}
          onClick={props.onToggle}
          aria-label="Previews"
          aria-expanded={props.open}
        />
        <Show when={aggregate() !== "idle" || runningCount(props.snapshots) > 0}>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute bottom-1 right-1 size-2 rounded-full"
            style={{ background: dotColor() }}
          />
        </Show>
      </span>
    </TooltipV2>
  )
}
