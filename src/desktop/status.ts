import type { PreviewRuntimeState } from "../types/index.js"
import type { PreviewSnapshot } from "../service/ipc.js"

export type PreviewAggregate = "idle" | "active" | "starting" | "error"

export function aggregateStatus(snapshots: PreviewSnapshot[]): PreviewAggregate {
  if (snapshots.some((s) => s.status === "crashed" || s.status === "port-in-use")) {
    return "error"
  }
  if (snapshots.some((s) => s.status === "starting" || s.status === "stopping")) {
    return "starting"
  }
  if (snapshots.some((s) => s.status === "running")) {
    return "active"
  }
  return "idle"
}

export function runningCount(snapshots: PreviewSnapshot[]): number {
  return snapshots.filter((s) => s.status === "running").length
}

/** Tooltip text: `Previews` plus an optional live suffix. */
export function previewTooltip(snapshots: PreviewSnapshot[]): string {
  const running = runningCount(snapshots)
  if (snapshots.length === 0) return "Previews"
  if (running === 0) return "Previews"
  return `Previews · ${running} running`
}

export function statusLabel(status: PreviewRuntimeState): string {
  switch (status) {
    case "running":
      return "Running"
    case "starting":
      return "Starting"
    case "stopping":
      return "Stopping"
    case "stopped":
      return "Stopped"
    case "crashed":
      return "Crashed"
    case "port-in-use":
      return "Port in use"
  }
}

/** Status dot color: gray / green / red / yellow. */
export function statusColor(status: PreviewRuntimeState): string {
  switch (status) {
    case "running":
      return "var(--v2-icon-icon-success, #22c55e)"
    case "starting":
    case "stopping":
      return "var(--v2-icon-icon-warning, #eab308)"
    case "crashed":
    case "port-in-use":
      return "var(--v2-icon-icon-danger, #ef4444)"
    case "stopped":
      return "var(--v2-icon-icon-muted, #9ca3af)"
  }
}

export function formatUptime(uptimeMs?: number): string {
  if (uptimeMs === undefined) return "—"
  const totalSeconds = Math.max(0, Math.floor(uptimeMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function statusGlyph(status: PreviewRuntimeState): string {
  switch (status) {
    case "running":
      return "●"
    case "starting":
    case "stopping":
      return "◐"
    case "stopped":
      return "○"
    case "crashed":
      return "×"
    case "port-in-use":
      return "⚠"
  }
}
