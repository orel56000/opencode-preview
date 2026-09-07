import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  aggregateStatus,
  previewTooltip,
  runningCount,
  statusColor,
  statusGlyph,
  statusLabel,
} from "../src/desktop/status.js"
import { formatUptime } from "../src/desktop/status.js"
import type { PreviewSnapshot } from "../src/service/ipc.js"

function snapshot(id: string, status: PreviewSnapshot["status"]): PreviewSnapshot {
  return {
    definition: { id, name: id, command: "npm run dev", port: 5173 },
    status,
  }
}

describe("desktop status helpers", () => {
  it("aggregates idle/active/starting/error", () => {
    assert.equal(aggregateStatus([]), "idle")
    assert.equal(aggregateStatus([snapshot("a", "stopped")]), "idle")
    assert.equal(aggregateStatus([snapshot("a", "running")]), "active")
    assert.equal(
      aggregateStatus([snapshot("a", "running"), snapshot("b", "starting")]),
      "starting",
    )
    assert.equal(
      aggregateStatus([snapshot("a", "running"), snapshot("b", "crashed")]),
      "error",
    )
    assert.equal(aggregateStatus([snapshot("a", "port-in-use")]), "error")
  })

  it("builds concise tooltips and counts", () => {
    assert.equal(previewTooltip([]), "Previews")
    assert.equal(previewTooltip([snapshot("a", "stopped")]), "Previews")
    assert.equal(
      previewTooltip([snapshot("a", "running"), snapshot("b", "stopped")]),
      "Previews · 1 running",
    )
    assert.equal(runningCount([snapshot("a", "running"), snapshot("b", "running")]), 2)
  })

  it("labels every state without noise", () => {
    assert.equal(statusLabel("running"), "Running")
    assert.equal(statusLabel("port-in-use"), "Port in use")
    assert.equal(statusGlyph("running"), "●")
    assert.equal(statusGlyph("stopped"), "○")
    assert.equal(statusGlyph("starting"), "◐")
    assert.equal(statusGlyph("crashed"), "×")
    assert.equal(statusGlyph("port-in-use"), "⚠")
    for (const status of ["stopped", "starting", "running", "stopping", "crashed", "port-in-use"] as const) {
      assert.match(statusColor(status), /var\(--v2-icon-icon-|#[0-9a-f]{6}\)?/)
    }
  })

  it("formats uptime as HH:MM:SS", () => {
    assert.equal(formatUptime(undefined), "—")
    assert.equal(formatUptime(0), "00:00:00")
    assert.equal(formatUptime(3723000), "01:02:03")
  })
})
