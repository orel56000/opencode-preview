/**
 * Standalone typecheck stubs mirroring the real upstream OpenCode modules.
 *
 * When these files live inside the OpenCode tree (see `desktop-patch/`),
 * the real modules resolve:
 * - `@opencode-ai/ui/v2/*` from `packages/ui/src/v2/components/*`
 * - `@/components/session-context-usage` from `packages/app/src/...`
 *
 * Props below mirror the upstream APIs as of OpenCode 1.18.x
 * (verified against source: `IconButtonV2Props`, `TooltipV2Props`,
 * `IconProps` with the `monitor` icon name).
 */
declare module "@opencode-ai/ui/v2/icon-button-v2" {
  import type { JSX } from "solid-js"
  export interface IconButtonV2Props {
    type?: string
    variant?: "neutral" | "contrast" | "ghost" | "ghost-muted"
    size?: "small" | "normal" | "large"
    icon?: JSX.Element
    onClick?: (event: MouseEvent) => void
    "aria-label"?: string
    "aria-expanded"?: boolean
    class?: string
    classList?: Record<string, boolean | undefined>
    ref?: (el: HTMLButtonElement) => void
  }
  export function IconButtonV2(props: IconButtonV2Props & { children?: JSX.Element }): JSX.Element
}

declare module "@opencode-ai/ui/v2/tooltip-v2" {
  import type { JSX } from "solid-js"
  export interface TooltipV2Props {
    value: JSX.Element
    placement?: "top" | "bottom" | "left" | "right" | "bottom-end" | "top-start"
    shift?: number
    children: JSX.Element
  }
  export function TooltipV2(props: TooltipV2Props): JSX.Element
}

declare module "@opencode-ai/ui/v2/icon" {
  import type { JSX } from "solid-js"
  export interface IconProps {
    name:
      | "monitor"
      | "close"
      | "plus"
      | "check"
      | "chevron-down"
      | "outline-share"
      | "outline-copy"
      | "outline-square-arrow"
      | (string & {})
    size?: "small" | "normal" | "large"
    class?: string
  }
  export function Icon(props: IconProps): JSX.Element
}

declare module "@opencode-ai/ui/v2/badge-v2" {
  import type { JSX } from "solid-js"
  export interface BadgeV2Props {
    variant?: "neutral" | "success" | "warning" | "danger" | "info"
    children: JSX.Element
    class?: string
  }
  export function BadgeV2(props: BadgeV2Props): JSX.Element
}

declare module "@opencode-ai/ui/v2/button-v2" {
  import type { JSX } from "solid-js"
  export interface ButtonV2Props {
    variant?: "primary" | "secondary" | "ghost" | "danger"
    size?: "small" | "normal" | "large"
    disabled?: boolean
    onClick?: (event: MouseEvent) => void
    children: JSX.Element
    "aria-label"?: string
    class?: string
  }
  export function ButtonV2(props: ButtonV2Props): JSX.Element
}
