import type { TuiPlugin } from "@opencode-ai/plugin/tui"
import { PreviewPanel } from "./ui/PreviewPanel.js"

export const tui: TuiPlugin = async (api) => {
  const projectDirectory = api.state.path.directory
  if (!projectDirectory) {
    return
  }

  const slotCleanup = (api.ui as unknown as Record<string, any>).slot({
    append: "sidebar.content",
    render: () => <PreviewPanel projectDirectory={projectDirectory} api={api} />,
  }) as (() => void) | undefined

  const keymapCleanup = api.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "opencode-preview.reload",
        title: "Reload previews",
        group: "Previews",
        palette: true,
        run: async () => {
          api.ui.toast({ message: "Previews config reloaded", variant: "info" })
        },
      },
    ],
  }))

  api.lifecycle.onDispose(async () => {
    keymapCleanup()
    slotCleanup?.()
  })
}

export default tui
