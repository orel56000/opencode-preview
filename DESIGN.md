# opencode-preview design

## OpenCode API target

OpenCode 1.18.21 / @opencode-ai/plugin 1.18.29.

The docs describe a richer `PluginContext` than the shipped types expose.
Use the shipped exports that actually exist:

- V2 plugin definition: `import { define } from "@opencode-ai/plugin/v2/promise"`
- V1 fallback: `export async function server(input: PluginInput): Promise<Hooks>` from `@opencode-ai/plugin`
- TUI plugin: export `const tui: TuiPlugin` using `@opencode-ai/plugin/tui`

Combine them so the default export works for both V1 and V2:

```ts
import { define } from "@opencode-ai/plugin/v2/promise"
import type { PluginInput, Hooks } from "@opencode-ai/plugin"

const v2Plugin = define({ id: "opencode-preview", setup(ctx) { ... } })

export default {
  ...v2Plugin,
  async server(input: PluginInput, options?: Record<string, unknown>): Promise<Hooks> {
    return makeServerHooks(input, options)
  }
}
```

The TUI plugin is a separate export `./tui`.

## Architecture

### Server plugin (`src/index.ts`)

Runs on the OpenCode server.
Responsibilities:
- Register agent tools: `preview_register`, `preview_list`, `preview_start`, `preview_stop`
- Read/write `.opencode/previews.json`
- Return hooks and dispose cleanup

Agent tools mutate the project preview config file. They do NOT spawn processes.
The TUI plugin owns process lifecycle.

### TUI plugin (`src/tui.tsx`)

Runs in the OpenCode CLI / terminal process.
Responsibilities:
- Render a persistent preview panel via `api.ui.slot({ append: "sidebar.content", render: ... })`
- Watch `.opencode/previews.json` and reload
- Manage child processes: start, stop, restart
- Poll ports for readiness / occupancy
- Capture logs with bounded buffer
- Open browser via `open` package
- Auto-start previews with `autoStart: true`
- Clean up all managed processes on plugin unload / dispose

### Config (`src/config/schema.ts`, `src/config/loader.ts`)

Schema using Zod:

```ts
interface PreviewDefinition {
  id: string
  name: string
  command: string
  cwd?: string
  port: number
  host?: string
  path?: string
  env?: Record<string, string>
  autoStart?: boolean
}
```

Config file: `.opencode/previews.json`
Defaults: host `localhost`, path `/`.
Validate and produce friendly errors.

### Preview manager (`src/preview/manager.ts`)

Owns the collection of PreviewInstance objects.
Methods:
- load(configPath)
- start(id)
- stop(id)
- restart(id)
- open(id)
- getState(id)
- dispose()

### Preview instance (`src/preview/process.ts`)

State machine:
`Stopped -> Starting -> Running -> Stopping -> Stopped`
Crashed is terminal-ish from Starting/Running.
PortInUse is a state when the configured port is occupied by a non-managed process.

Each instance:
- spawns command via `spawn(command, { shell: true, cwd, env, detached: true })`
- captures stdout/stderr into a rolling log buffer (max 2000 lines)
- polls port for readiness
- kills process tree on stop

### Port utilities (`src/preview/ports.ts`)

- `isPortReachable(host, port, timeout?)`
- `isPortInUse(port)` using `net.createServer().listen()` or a fast TCP connect
- `waitForPort(host, port, options)` with timeout and interval

### Process tree cleanup (`src/preview/process.ts`)

Cross-platform tree kill:
- macOS/Linux: `kill(-pid, SIGTERM)` then `SIGKILL` after timeout; if that fails, enumerate children via `pgrep -P pid` and kill each.
- Windows: `taskkill /T /F /PID pid`

Track only PIDs we spawned. Never kill arbitrary processes.

### Browser (`src/preview/browser.ts`)

Use `open` package with URL `http://host:port/path`.

### Logs (`src/preview/logs.ts`)

RollingBuffer class:
- maxLines
- push(line)
- getLines()
- onChange callback

Preserve ANSI bytes as strings.

### TUI components (`src/ui/`)

- `PreviewPanel.tsx`: root panel rendered into sidebar.content slot
- `PreviewList.tsx`: list of previews with state and action select
- `PreviewDetails.tsx`: expanded view with metadata + live logs in scrollbox

Use OpenTUI intrinsic elements: box, text, select, scrollbox.
Use `api.keymap.layer` for global shortcut to open previews panel (e.g. `ctrl+p` if free, otherwise just palette command).

Because OpenTUI has no native `<button>`, use a `<select>` with action options as the real interactive control.

### Tools (`src/tools/preview-tools.ts`)

V1 `tool` hook definitions for `preview_register`, `preview_list`, `preview_start`, `preview_stop`.
Input/output schemas as JSON schema objects.
These call into config loader/writer.

## State flow

1. Project loads plugin.
2. TUI plugin reads `.opencode/previews.json`.
3. For each preview with `autoStart: true`, manager begins start sequence.
4. User presses Start/Stop/Restart/Open via TUI select control.
5. Manager updates state, spawns/kills process, polls port.
6. UI re-renders via Solid signals.
7. Agent uses `preview_register` tool to add/update a preview in config.
8. TUI file watcher detects change and reloads.

## Cleanup

- On TUI plugin unload / lifecycle dispose, stop all managed processes.
- On server plugin dispose, nothing special beyond file handles.
- Use `process.on("exit", ...)` as a last resort to kill children.

## Tests

Write tests in `tests/*.test.ts` using `node:test`.
At minimum:
- config validation
- port availability / readiness
- rolling log buffer
- URL building
- state machine transitions
- process tree cleanup (where safe)
