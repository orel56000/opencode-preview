# Upstream integration — implemented and verified

Target: OpenCode source (`sst/opencode`, branch `dev`, commit `57ef382`).

Two commits on a local branch `preview-desktop-slot`:

1. `5384aff` — **generic chat toolbar slot** (upstream-suitable, no new deps)
2. `4d9aefa` — **Preview integration** (uses this package for the backend)

The `*.patch` files in this directory were the initial proposal; the list
below is what was actually implemented, built, and tested in a packaged
`OpenCode Dev.app` on macOS (arm64).

## Commit 1 — generic slot

| File | Change |
|---|---|
| `packages/app/src/components/chat-toolbar-slot.tsx` | NEW: `registerChatToolbarAction()` / `<ChatToolbarSlot/>` |
| `packages/app/src/pages/session/timeline/message-timeline.tsx` | render `<ChatToolbarSlot/>` directly after `<SessionContextUsage/>` |

## Commit 2 — Preview integration

| File | Change |
|---|---|
| `packages/app/src/context/platform.tsx` | `PreviewPlatform` + `PreviewSnapshot` types, optional `previews` field |
| `packages/app/src/components/previews/` | NEW: `PreviewHost`, `PreviewButton`, `PreviewPanel`, `PreviewItem`, `PreviewDetails`, `store`, `status`, `toolbar-init` (adapted from `src/desktop/` in this repo) |
| `packages/app/src/pages/session/timeline/message-timeline.tsx` | side-effect import of `toolbar-init` (registers `preview`, order 10) |
| `packages/desktop/package.json` | `file:` dependency on this package (swap for the npm version upstream) |
| `packages/desktop/src/main/previews/service-host.ts` | NEW: per-directory `PreviewService`, validated IPC handlers |
| `packages/desktop/src/main/ipc.ts` | register preview IPC handlers |
| `packages/desktop/src/main/index.ts` | `disposePreviewServices()` on shutdown |
| `packages/desktop/src/preload/types.ts` | `PreviewBridgeAPI` + `previews` on `ElectronAPI` |
| `packages/desktop/src/preload/index.ts` | `previews` bridge via `ipcRenderer.invoke` |
| `packages/desktop/src/renderer/index.tsx` | `previews` on the desktop `Platform` object |

## Desktop ↔ plugin communication

```text
Renderer (SolidJS)                    Electron main (Node)
PreviewHost/store                     PreviewService per project dir
  │ usePlatform().previews              │ PreviewManager + ports + logs
  │ window.api.previews.*               │ opener = shell.openExternal
  ▼ typed invoke (dir-aware)            ▼ (this package's core)
opencode-preview:list/start/stop/restart/open/logs
```

- Renderer polls snapshots every 1.5s; logs fetched on selection (500 lines).
- `directory` comes from the session SDK; main routes to the per-project
  service. State is isolated per project.
- URLs open via the existing validated `open-external` path (`http/https`).
- Quitting the app stops all managed preview processes (verified: ports freed).

## Verification (packaged app, real Electron UI via CDP)

- `[ Context ] [ Preview ]` placement, status dot, tooltip — screenshot
- Empty state, two-service list, Start → Running + live HTTP traffic
- Details (URL/port/PID/ticking uptime/command) + live logs
- Restart (new PID, serving), Open (via `shell.openExternal`), Stop ×2
- Config watching (new `previews.json` picked up live), shutdown cleanup

Screenshots: `docs/screenshots/desktop-both-running.png`,
`docs/screenshots/desktop-details-logs.png`.

## Security properties

- Process kill targets only PIDs spawned by the service (group kill on
  POSIX, `taskkill /T` on Windows). Unknown port occupants are reported,
  never killed.
- Env secrets never cross IPC and are never logged.
- IDs/directories validated on both IPC sides.
- No webview, no Node-integration changes.
