# opencode-preview

Interactive preview manager for OpenCode — start, stop, restart and open development servers directly from the TUI.

![demo](https://i.imgur.com/example.png)

## Features

- **Preview panel** inside OpenCode's sidebar — no slash commands needed.
- **Start / Stop / Restart** buttons (via interactive `<select>` control).
- **Open in browser** — launches the configured URL with `open`.
- **Port monitoring** — polls until the server is ready before marking Running; detects port-in-use without killing arbitrary processes.
- **Live logs** — bounded rolling buffer (2000 lines) streamed in real time.
- **Multiple services** — run frontend + API independently.
- **Project config** — declared in `.opencode/previews.json` (auto-detected scripts too).
- **Agent tools** — `preview_register`, `preview_list`, `preview_start`, `preview_stop` for AI agent integration.
- **Cross-platform** — process tree cleanup on macOS, Linux, Windows (`taskkill /T`).
- **Auto-start** — previews with `"autoStart": true` launch when the project opens.

## Installation

### From GitHub (recommended)

Add the plugin to your `opencode.jsonc` via its git source:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:orel56000/opencode-preview"]
}
```

Or install a local clone by path:

```jsonc
{
  "plugins": ["../opencode-preview"]
}
```

### From npm

The npm name `opencode-preview` is already taken by an unrelated project, so this plugin is published scoped as `@orel56000/opencode-preview`:

```jsonc
{
  "plugins": ["@orel56000/opencode-preview"]
}
```

### CLI-only usage

For CLI-only usage (remote server), add the plugin to `cli.json`:

```json
{
  "plugins": ["@orel56000/opencode-preview"]
}
```

Previews are configured per-project in `.opencode/previews.json`.

## Configuration

Create `.opencode/previews.json` in your project root:

```json
{
  "previews": [
    {
      "id": "web",
      "name": "Frontend",
      "command": "npm run dev",
      "cwd": ".",
      "port": 5173,
      "path": "/",
      "host": "localhost"
    },
    {
      "id": "api",
      "name": "API",
      "command": "npm run dev:api",
      "port": 3000
    }
  ]
}
```

### Schema

```ts
interface PreviewDefinition {
  id: string                // Unique slug (letters, numbers, -, _)
  name: string              // Displayed label
  command: string           // Shell command to execute
  cwd?: string              // Working directory (default ".")
  port: number              // TCP port the server listens on
  host?: string             // Host bind (default "localhost")
  path?: string             // URL suffix (default "/")
  env?: Record<string, string>  // Extra environment variables
  autoStart?: boolean       // Start when project loads (default false)
}
```

## Usage

When you open OpenCode in a project with a preview config, the **PREVIEWS** section appears in the sidebar.

Each preview shows:

```
○ Name          :port
[ Start ]
```

States and indicators:

| State | Symbol | Meaning |
|---|---|---|
| Stopped | ○ | Server not running |
| Starting | ◐ | Spawned, waiting for port readiness |
| Running | ● | Port reachable, server is up |
| Stopping | ◐ | Killing process tree |
| Crashed | × | Process exited unexpectedly — see error log |
| Port in use | ⚠ | Configured port occupied by unknown process |

Actions:

- **Stopped** → `[ Start ]` spawns the command and polls the port.
- **Running** → `[ Stop ]` [Restart] [Open ↗] fully terminate the managed process tree.
- **Crashed** → `[ Start Again ]` attempts a fresh start (useful after crash).
- **Port in use** → `[ Start Again ]` will fail again; use `[Open ↗]` to visit anyway.

Open selects a preview to show details including live logs in a scrollbox.

Reload previews via the palette command **"Reload previews"**.

## Multiple services

Both previews can run simultaneously. Each manages its own process tree independently:

```jsonc
// .opencode/previews.json
{
  "previews": [
    { "id": "web", "name": "Frontend", "command": "npm run dev", "port": 5173 },
    { "id": "api", "name": "API", "command": "npm run api", "port": 3000 }
  ]
}
```

Stop one without affecting the other.

## Agent integration

When using an AI coding agent, it can manage previews through tools. Register a new preview:

```
tool_use: preview_register({ id: "docs", name: "Docs", command: "npm run docs", port: 3001 })
```

List current previews:

```
tool_use: preview_list()
```

Enable or disable auto-start:

```
tool_use: preview_start({ id: "web" })
tool_use: preview_stop({ id: "web" })
```

These tools modify `.opencode/previews.json` and the TUI automatically reloads when the file changes. The agent does not spawn processes directly — that is handled by the TUI manager.

## Security

- Preview commands are trusted project configuration (defined by you in `previews.json`).
- Commands execute with shell expansion but no untrusted interpolation.
- Process kill operations **only** target PIDs spawned by this plugin.
- If a configured port is already occupied by an unknown process, the plugin does NOT kill it — it reports port-in-use and lets the user decide.
- Sensitive environment variables are not echoed in the UI.
- File paths are validated against the project directory to prevent traversal.

## Compatibility

Tested with:

- OpenCode `1.18.x` (plugin SDK `@opencode-ai/plugin` 1.18.21+)
- Node.js `>=20` (Bun recommended for runtime loading)

Because OpenCode 2 is currently beta, the plugin API may change. This plugin targets the V1 server hook pattern (`export default { ...Plugin.define(...), async server(...) }`) which works on OpenCode 1.18.x. It also includes a V2 Promise-compatible entry point.

Monitor the [OpenCode releases page](https://github.com/opencode-ai/opencode/releases) for API updates.

## Development

```bash
git clone https://github.com/orel56000/opencode-preview.git
cd opencode-preview
npm install
npm run typecheck   # TypeScript strict check
npm test            # Run tests
npm pack            # Create .tgz for local testing
```

Install locally in a test project:

```bash
cd /path/to/test-project
npm install /path/to/opencode-preview
```

Or link it for live development:

```bash
npm link && cd /path/to/test-project && npm link @orel56000/opencode-preview
```

Edit source files under `src/` and reload OpenCode to see changes.

## Contributing

Issues and pull requests welcome. Please open an issue for feature discussions. For bug fixes, include reproduction steps.

Run `npm run typecheck` and `npm test` before submitting.

## License

MIT — see [LICENSE](LICENSE).
