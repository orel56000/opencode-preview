import { PreviewPanel } from "./ui/PreviewPanel.js";
export const tui = async (api) => {
    const projectDirectory = api.state.path.directory;
    if (!projectDirectory) {
        return;
    }
    const slotCleanup = api.ui.slot({
        append: "sidebar.content",
        render: () => <PreviewPanel projectDirectory={projectDirectory} api={api}/>,
    });
    const keymapCleanup = api.keymap.layer(() => ({
        mode: "global",
        commands: [
            {
                id: "opencode-preview.reload",
                title: "Reload previews",
                group: "Previews",
                palette: true,
                run: async () => {
                    api.ui.toast({ message: "Previews config reloaded", variant: "info" });
                },
            },
        ],
    }));
    api.lifecycle.onDispose(async () => {
        keymapCleanup();
        slotCleanup?.();
    });
};
export default tui;
//# sourceMappingURL=tui.jsx.map