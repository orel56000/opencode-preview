import { createMemo } from "solid-js"
import type { PreviewInstance } from "../preview/process.js"
import type { PreviewState } from "../types/index.js"
import { usePreview } from "./context.js"

const stateSymbol: Record<PreviewState["status"], string> = {
  stopped: "○",
  starting: "◐",
  running: "●",
  stopping: "◐",
  crashed: "×",
  "port-in-use": "⚠",
}

export function PreviewItem(props: {
  instance: PreviewInstance
  selected: boolean | undefined
  onSelect: () => void
}) {
  const { api } = usePreview()
  const state = createMemo(() => props.instance.getState())

  const actionOptions = createMemo(() => {
    const status = state().status
    if (status === "running") {
      return [
        { name: "Stop", description: "Stop the preview server", value: "stop" },
        { name: "Restart", description: "Restart the preview server", value: "restart" },
        { name: "Open ↗", description: "Open in default browser", value: "open" },
      ]
    }
    if (status === "crashed" || status === "port-in-use") {
      return [
        { name: "Start Again", description: "Try starting the preview server", value: "start" },
      ]
    }
    return [
      { name: "Start", description: "Start the preview server", value: "start" },
    ]
  })

  const handleAction = (action: string) => {
    if (action === "start") {
      void props.instance.start()
    } else if (action === "stop") {
      void props.instance.stop()
    } else if (action === "restart") {
      void props.instance.restart()
    } else if (action === "open") {
      void props.instance.open()
    }
    props.onSelect()
  }

  const urlText = createMemo(() => {
    const s = state()
    if (s.status === "running" && s.url) return s.url
    if (s.status === "port-in-use") return `Port ${s.definition.port}`
    return `:${s.definition.port}`
  })

  const theme = api.theme.current

  return (
    <box
      border={true}
      style={{
        borderColor: props.selected ? theme.borderActive : theme.border,
        padding: 1,
      }}
    >
      <text
        style={{
          fg:
            state().status === "crashed"
              ? theme.error
              : state().status === "port-in-use"
                ? theme.warning
                : theme.text,
        }}
      >
        {stateSymbol[state().status]} {state().definition.name}
      </text>
      <text style={{ fg: theme.textMuted }}>{urlText()}</text>
      {state().status === "crashed" && state().error ? (
        <text style={{ fg: theme.error }}>{state().error}</text>
      ) : null}
      {state().status === "port-in-use" && state().error ? (
        <text style={{ fg: theme.warning }}>{state().error}</text>
      ) : null}
      <select
        options={actionOptions()}
        onSelect={(_index, option) => {
          if (option?.value) handleAction(option.value as string)
        }}
      />
    </box>
  )
}
