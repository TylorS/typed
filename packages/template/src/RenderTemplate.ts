/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Fx from "@typed/fx/Fx"
import type { Scope } from "effect/Scope"
import type { Placeholder } from "./Placeholder.js"
import type { Renderable } from "./Renderable.js"
import type { RenderEvent } from "./RenderEvent.js"
import type { RenderQueue } from "./RenderQueue.js"

/**
 * @since 1.0.0
 */
export interface RenderTemplate {
  <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ): Fx.Fx<RenderEvent, Placeholder.Error<Values[number]>, Scope | RenderQueue | Placeholder.Context<Values[number]>>
}

/**
 * @since 1.0.0
 */
export const RenderTemplate: Context.Tagged<RenderTemplate, RenderTemplate> = Context.Tagged<
  RenderTemplate,
  RenderTemplate
>(
  "@typed/template/RenderTemplate"
)
/**
 * @since 1.0.0
 */
export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderEvent,
  Placeholder.Error<Values[number]>,
  RenderTemplate | RenderQueue | Scope | Placeholder.Context<Values[number]>
> {
  return Fx.fromFxEffect(RenderTemplate.with((render) => render(template, values)))
}
