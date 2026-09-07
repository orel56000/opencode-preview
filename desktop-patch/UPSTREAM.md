# Upstream integration proposal for OpenCode Desktop

This document records the exact OpenCode source locations this plugin integrates
with, and the minimal upstream change required for a native Desktop experience.

Verified against OpenCode source (`sst/opencode`, `packages/*`, v1.18.x era).

## 1. Where the context indicator lives

- Component: `packages/app/src/components/session-context-usage.tsx`
  (`SessionContextUsage`, circular `ProgressCircle` / `ProgressCircleV2`).
- Placement in the chat header: `packages/app/src/pages/session/timeline/message-timeline.tsx`
  (renders `<SessionContextUsage placement="bottom" … />` in the session title
  row, next to the overflow menu).
- Also used as `variant="indicator"` in `packages/app/src/pages/session/session-side-panel.tsx`.

There is **no toolbar extension point** in the Desktop renderer today.

## 2. Why plugins cannot inject Desktop UI today

- Server plugins (`@opencode-ai/plugin`) provide `tool` hooks and lifecycle
  events only. There is no HTTP-route or renderer-slot API.
- TUI plugins (`@opencode-ai/plugin/tui`) can render via `api.ui.slot(...)`
  into named slots (`sidebar_content`, `session_prompt_right`, `home_logo`,
  `home_prompt`, `app_bottom`, `app` — see `packages/tui/src/plugin/*` and
  `packages/tui/src/routes/*`). The Desktop renderer (`packages/app`,
  SolidJS in Electron) has **no equivalent slot registry**.
- Therefore Desktop UI integration requires a small upstream addition.
  This repo proposes the smallest possible one (see below) and ships the
  Preview UI against it. No DOM monkey-patching, no injected scripts.

## 3. Proposed upstream change (small, reviewable)

**A. Generic chat-toolbar slot** — `packages/app/src/components/chat-toolbar-slot.tsx`
(new file, ~40 lines; a copy of `src/desktop/toolbar-slot.tsx` in this repo):

```tsx
registerChatToolbarAction({ id, order, render })
```

Render `<ChatToolbarSlot />` in `message-timeline.tsx` directly after
`<SessionContextUsage … />`. This primitive is reusable by future
Git / Database / Docker / Testing plugins.

**B. Preview backend in Electron main** — `packages/desktop/src/main/previews/*`
(new directory):

- one `PreviewService` (from this package) per project directory,
- `registerPreviewIpcMain(ipcMain, service)` from this package,
- opener injected as `(url) => shell.openExternal(url)` reusing the existing
  `open-external` validation (`resolveExternalURL` in
  `packages/desktop/src/main/external-url.ts`, wired in
  `packages/desktop/src/main/ipc.ts`).

This mirrors the existing `wsl-servers-*` IPC pattern
(`packages/desktop/src/main/ipc.ts`, `packages/desktop/src/preload/index.ts`).

**C. Renderer host** — mount `<PreviewHost client={…} />` from this package
right after `<SessionContextUsage … />` in `message-timeline.tsx`
(see `PREVIEW_INTEGRATION.patch`). The renderer never spawns processes;
all lifecycle runs in Electron main through the typed bridge
(`src/service/ipc.ts`, `preload.ts`, `client.ts`).

## 4. Security properties of the proposal

- Preview pages are opened in the OS browser via `shell.openExternal`
  (validated `http:`/`https:` only). No webview, no Node integration change.
- Process kill targets only PIDs spawned by the service (negative-PID group
  kill + `taskkill /T` on Windows). Unknown port occupants are never killed.
- Env secrets never cross IPC; snapshots exclude `env`. Logs are bounded
  (2000 lines) and never include env var dumps.
- `cwd` is resolved inside the project directory; IDs/ports validated by Zod
  on both sides of the IPC boundary.
