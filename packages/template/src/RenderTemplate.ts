import * as Context from "@typed/context"
import type { ElementRef } from "@typed/template/ElementRef"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { TemplateInstance } from "@typed/template/TemplateInstance"
import type { Rendered } from "@typed/wire"
import type * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"

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

export const RenderTemplate: Context.Tagged<RenderTemplate, RenderTemplate> = Context.Tagged<
  RenderTemplate,
  RenderTemplate
>(
  "@typed/template/RenderTemplate"
)

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<
  RenderTemplate | Scope | Placeholder.Context<Values[number]>,
  never,
  TemplateInstance<Placeholder.Error<Values[number]>, Rendered>
> {
  return RenderTemplate.withEffect((render) => render(template, values))
}

export function as<T extends Rendered = Rendered>(ref: ElementRef<T>) {
  return function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    ...values: Values
  ): Effect.Effect<
    Scope | RenderTemplate | Placeholder.Context<Values[number]>,
    never,
    TemplateInstance<Placeholder.Error<Values[number]>, T>
  > {
    return RenderTemplate.withEffect((render) => render(template, values, ref))
  }
}
