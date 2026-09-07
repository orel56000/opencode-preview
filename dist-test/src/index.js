import { define } from "@opencode-ai/plugin/v2/promise";
import { makePreviewTools } from "./tools/preview-tools.js";
async function createServerHooks(input) {
    const tools = makePreviewTools(input.directory);
    return {
        tool: tools,
        dispose: async () => { },
    };
}
export default {
    ...define({
        id: "opencode-preview",
        async setup() { },
    }),
    async server(input, _options) {
        return createServerHooks(input);
    },
};
//# sourceMappingURL=index.js.map