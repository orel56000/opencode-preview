import { createSignal, createMemo, onCleanup } from "solid-js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { PreviewManager } from "../preview/manager.js"
import { PreviewContext } from "./context.js"
import { PreviewItem } from "./PreviewItem.js"
import { PreviewDetails } from "./PreviewDetails.js"

export function PreviewPanel(props: {
  projectDirectory: string
  api: TuiPluginApi
}) {
  const [selectedId, setSelectedId] = createSignal<string | undefined>(undefined)
  const [refresh, setRefresh] = createSignal(0)

  const manager = new PreviewManager({
    projectDirectory: props.projectDirectory,
    onChange: () => {
      setRefresh((r) => r + 1)
    },
  })

  let initialized = false
  const init = async () => {
    if (initialized) return
    initialized = true
    await manager.loadConfig()
    manager.watchConfig()
  }
  void init()

  onCleanup(() => {
    void manager.dispose()
  })

  const instances = createMemo(() => {
    refresh()
    return manager.getInstances().map((instance) => instance.getState().definition.id)
  })

  const instancesMap = createMemo(() => {
    refresh()
    return new Map(manager.getInstances().map((i) => [i.getState().definition.id, i]))
  })

  return (
    <PreviewContext.Provider value={{ manager, api: props.api }}>
      <box border={true} title="PREVIEWS" gap={1} style={{ padding: 1 }}>
        {instances().length === 0 ? (
          <text style={{ fg: props.api.theme.current.textMuted }}>
            No previews configured.
          </text>
        ) : (
          instances().map((id) => {
            const instance = manager.getInstance(id)
            if (!instance) return null
            return (
              <PreviewItem
                instance={instance}
                selected={selectedId() === id}
                onSelect={() => setSelectedId(id)}
              />
            )
          })
        )}

        {selectedId() ? (
          (() => {
            const instance = instancesMap().get(selectedId()!)
            return instance ? <PreviewDetails instance={instance} /> : null
          })()
        ) : null}
      </box>
    </PreviewContext.Provider>
  )
}
