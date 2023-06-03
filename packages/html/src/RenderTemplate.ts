import { Scope } from '@effect/io/Scope'
import { Tag } from '@typed/context'
import { Fx } from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { RenderEvent } from './RenderEvent.js'
import { Renderable } from './Renderable.js'

export interface RenderTemplate {
  readonly renderTemplate: <const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    values: Values,
    options?: RenderTemplateOptions,
  ) => Fx<
    Scope | Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    RenderEvent
  >
}

export interface RenderTemplateOptions {
  readonly isSvg?: boolean
}

export const RenderTemplate = Tag<RenderTemplate>('RenderTemplate')

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx<
  RenderTemplate | Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  RenderEvent
> {
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values))
}

export function svg<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx<
  RenderTemplate | Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  RenderEvent
> {
  return RenderTemplate.withFx(({ renderTemplate }) =>
    renderTemplate(template, values, { isSvg: true }),
  ) as any
}
