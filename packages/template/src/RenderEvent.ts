/**
 * @since 1.0.0
 */

import type { Rendered } from "@typed/wire"

/**
 * @since 1.0.0
 */
export type RenderEvent = DomRenderEvent | HtmlRenderEvent

/**
 * @since 1.0.0
 */
export type DomRenderEvent = {
  readonly _tag: "dom"
  readonly rendered: Rendered
  readonly valueOf: () => Rendered
}

/**
 * @since 1.0.0
 */
export function DomRenderEvent(rendered: Rendered): DomRenderEvent {
  return {
    _tag: "dom",
    rendered,
    valueOf: () => rendered
  }
}

/**
 * @since 1.0.0
 */
export type HtmlRenderEvent = {
  readonly _tag: "html"
  readonly html: string
  readonly valueOf: () => string
}

/**
 * @since 1.0.0
 */
export function HtmlRenderEvent(html: string): HtmlRenderEvent {
  return {
    _tag: "html",
    html,
    valueOf: () => html
  }
}

/**
 * @since 1.0.0
 */
export function isRenderEvent(value: unknown): value is RenderEvent {
  return isTaggedObject(value) && (value._tag === "html" || value._tag === "dom")
}

function isTaggedObject(
  value: unknown
): value is Record<string, unknown> & { readonly _tag: unknown } {
  return isObject(value) && "_tag" in value
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object"
}
