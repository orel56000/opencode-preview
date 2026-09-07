import { createMemo } from "solid-js";
import { usePreview } from "./context.js";
function formatDuration(ms) {
    if (ms === undefined)
        return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map((v) => v.toString().padStart(2, "0"))
        .join(":");
}
export function PreviewDetails(props) {
    const { api } = usePreview();
    const state = createMemo(() => props.instance.getState());
    const logs = createMemo(() => props.instance.logs.getLines());
    const theme = api.theme.current;
    return (<box border={true} title="Details" style={{ padding: 1, gap: 1 }}>
      <text style={{ fg: theme.text }}>
        {state().definition.name} {state().status === "running" ? "● Running" : ""}
      </text>
      <text style={{ fg: theme.textMuted }}>
        URL {state().url ?? `http://${state().definition.host ?? "localhost"}:${state().definition.port}`}
      </text>
      <text style={{ fg: theme.textMuted }}>
        PID {state().pid ?? "-"}
      </text>
      <text style={{ fg: theme.textMuted }}>
        Uptime {formatDuration(state().uptimeMs)}
      </text>
      <text style={{ fg: theme.textMuted }}>
        Command {state().definition.command}
      </text>

      <text style={{ fg: theme.text, marginTop: 1 }}>Logs</text>
      <scrollbox style={{ height: 12, borderColor: theme.borderSubtle }}>
        {logs().map((line) => (<text style={{ fg: theme.textMuted }}>{line}</text>))}
      </scrollbox>
    </box>);
}
//# sourceMappingURL=PreviewDetails.jsx.map