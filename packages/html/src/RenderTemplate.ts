import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { RenderEvent } from './RenderEvent.js'
import { Renderable } from './Renderable.js'

export interface RenderTemplate {
  readonly renderTemplate: <Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    values: Values,
    options?: RenderTemplateOptions,
  ) => Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    RenderEvent
  >
}

export const RenderTemplate = Context.Tag<RenderTemplate>('@typed/html/RenderTemplate')

export interface TemplateFx<R, E> extends Fx.Fx<R, E, RenderEvent> {
  readonly template: TemplateStringsArray
}

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderTemplate | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  RenderEvent
> {
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values))
}

export function svg<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderTemplate | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  RenderEvent
> {
  return RenderTemplate.withFx(({ renderTemplate }) =>
    renderTemplate(template, values, { isSvg: true }),
  )
}

export interface RenderTemplateOptions {
  readonly isSvg?: boolean
}
