import * as Scope from '@effect/io/Scope'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { RenderEvent } from './RenderEvent.js'
import { Renderable } from './Renderable.js'

export interface RenderTemplate {
  readonly renderTemplate: <Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    values: Values,
  ) => Fx.Fx<
    Placeholder.Context<Values[number]> | Scope.Scope,
    Placeholder.Error<Values[number]>,
    RenderEvent
  >
}

export const RenderTemplate = Context.Tag<RenderTemplate>('@typed/html/RenderTemplate')

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderTemplate | Scope.Scope | Placeholder.Context<Values[number]>,
  Placeholder.Error<Values[number]>,
  RenderEvent
> {
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values))
}
