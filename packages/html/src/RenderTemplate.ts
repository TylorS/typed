import { Tag } from '@typed/context'
import { Fx } from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { Renderable } from './Renderable.js'
import { TemplateResult } from './TemplateResult.js'

export interface RenderTemplate {
  readonly renderTemplate: <const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    values: Values,
    options?: RenderTemplateOptions,
  ) => Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    TemplateResult
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
  RenderTemplate | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values))
}

export function svg<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx<
  RenderTemplate | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return RenderTemplate.withFx(({ renderTemplate }) =>
    renderTemplate(template, values, { isSvg: true }),
  )
}
