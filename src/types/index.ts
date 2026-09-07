export interface PreviewDefinition {
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

export type PreviewRuntimeState =
  | "stopped"
  | "starting"
  | "running"
  | "stopping"
  | "crashed"
  | "port-in-use"

export interface PreviewState {
  definition: PreviewDefinition
  status: PreviewRuntimeState
  pid?: number
  url?: string
  uptimeMs?: number
  error?: string
}

export interface PreviewsConfig {
  previews: PreviewDefinition[]
}
