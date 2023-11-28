/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Fx from "@typed/fx/Fx"
import type { Rendered } from "@typed/wire"
import type * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"
import type { ElementRef } from "./ElementRef.js"
import type { Placeholder } from "./Placeholder.js"
import type { Renderable } from "./Renderable.js"
import type { RenderEvent } from "./RenderEvent.js"
import type { TemplateInstance } from "./TemplateInstance.js"

/**
 * @since 1.0.0
 */
export interface RenderTemplate {
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    ref?: ElementRef<T>
  ): Effect.Effect<
    Scope | Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
    never,
    TemplateInstance<
      Placeholder.Error<Values[number]>,
      T
    >
  >
}

/**
 * @since 1.0.0
 */
export const RenderTemplate: Context.Tagged<RenderTemplate, RenderTemplate> = Context.Tagged<
  RenderTemplate,
  RenderTemplate
>(
  "./RenderTemplate.js"
)

/**
 * @since 1.0.0
 */
export interface TemplateFx<R, E, T extends Rendered = Rendered> extends
  Fx.Fx<
    RenderTemplate | Scope | R,
    E,
    RenderEvent
  >
{
  readonly instance: Effect.Effect<
    RenderTemplate | Scope | R,
    never,
    TemplateInstance<
      E,
      T
    >
  >
}

/**
 * @since 1.0.0
 */
export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): TemplateFx<Placeholder.Context<Values[number]>, Placeholder.Error<Values[number]>> {
  const instance = RenderTemplate.withEffect((render) => render(template, values))

  return Object.assign(Fx.fromFxEffect(instance), { instance })
}

/**
 * @since 1.0.0
 */
export function as<T extends Rendered = Rendered>(ref: ElementRef<T>) {
  return function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    ...values: Values
  ): TemplateFx<Placeholder.Context<Values[number]>, Placeholder.Error<Values[number]>, T> {
    const instance = RenderTemplate.withEffect((render) => render(template, values, ref))

    return Object.assign(Fx.fromFxEffect(instance), { instance })
  }
}
