/** @jsxImportSource solid-js */
import { For, type JSX } from "solid-js"

export interface ChatToolbarAction {
  /** Unique action id, e.g. `"preview"`. */
  id: string
  /** Render order; lower renders first. Context usage is `0`. */
  order?: number
  /** Rendered inline in the toolbar, beside the context indicator. */
  render: () => JSX.Element
}

const actions = new Map<string, ChatToolbarAction>()
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/**
 * Generic chat-toolbar extension primitive.
 *
 * This is the smallest reusable extension point the Desktop needs: future
 * plugins (Git, Database, Docker, Testing, …) register actions here instead
 * of patching toolbar files directly.
 *
 * ```ts
 * registerChatToolbarAction({ id: "preview", order: 10, render: () => <PreviewButton … /> })
 * ```
 */
export function registerChatToolbarAction(action: ChatToolbarAction): () => void {
  actions.set(action.id, action)
  notify()
  return () => {
    if (actions.delete(action.id)) notify()
  }
}

export function getChatToolbarActions(): ChatToolbarAction[] {
  return [...actions.values()].sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

export function onChatToolbarActionsChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Renders registered actions inline. Placed directly after the context indicator. */
export function ChatToolbarSlot(): JSX.Element {
  return (
    <For each={getChatToolbarActions()}>
      {(action) => action.render()}
    </For>
  )
}
