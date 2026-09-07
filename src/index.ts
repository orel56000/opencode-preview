import { define } from "@opencode-ai/plugin/v2/promise"
import type { PluginInput, PluginOptions, Hooks } from "@opencode-ai/plugin"
import { makePreviewTools } from "./tools/preview-tools.js"

async function createServerHooks(input: PluginInput): Promise<Hooks> {
  const tools = makePreviewTools(input.directory)
  return {
    tool: tools,
    dispose: async () => {},
  }
}

export default {
  ...define({
    id: "opencode-preview",
    async setup() {},
  }),
  async server(input: PluginInput, _options?: PluginOptions): Promise<Hooks> {
    return createServerHooks(input)
  },
}
