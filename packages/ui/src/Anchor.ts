/**
 * @since 1.0.0
 */

import type * as Fx from "@typed/fx/Fx"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderEvent } from "@typed/template/RenderEvent"
import { html, type RenderTemplate } from "@typed/template/RenderTemplate"
import type { Scope } from "effect"
import type { HTMLAnchorElementProperties } from "./dom-properties.js"
import type { TypedProps } from "./Props.js"

/**
 * @since 1.0.0
 */
export type AnchorProps = TypedProps<HTMLAnchorElementProperties, HTMLAnchorElement>

/**
 * @since 1.0.0
 */
export function Anchor<
  const Props extends AnchorProps,
  Children extends ReadonlyArray<Renderable<any, any>> = readonly []
>(
  props: Props,
  ...children: Children
): Fx.Fx<
  RenderTemplate | Scope.Scope | Placeholder.Context<Props[keyof Props] | Children[number]>,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  RenderEvent
> {
  return html`<a .props="${props}">${children}</a>`
}
