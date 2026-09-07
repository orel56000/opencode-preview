import { createContext, useContext } from "solid-js"
import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { PreviewManager } from "../preview/manager.js"

export interface PreviewContextValue {
  manager: PreviewManager
  api: TuiPluginApi
}

export const PreviewContext = createContext<PreviewContextValue | undefined>(undefined)

export function usePreview(): PreviewContextValue {
  const value = useContext(PreviewContext)
  if (!value) {
    throw new Error("usePreview must be used inside PreviewContext.Provider")
  }
  return value
}
