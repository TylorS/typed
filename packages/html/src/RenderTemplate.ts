import { Scope } from '@effect/io/Scope'
import { Tag } from '@typed/context'
import { Fx } from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { Renderable } from './Renderable.js'
import type { Rendered } from './render.js'

export interface RenderTemplate {
  readonly renderTemplate: <const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    values: Values,
    options?: RenderTemplateOptions,
  ) => Fx<
    Scope | Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Rendered
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
  Rendered
> {
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values))
}

html.as = <T extends Node>() =>
  html as any as <Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    ...values: Values
  ) => Fx<
    RenderTemplate | Scope | Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    T
  >

export function svg<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx<
  RenderTemplate | Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  SVGElement
> {
  return RenderTemplate.withFx(({ renderTemplate }) =>
    renderTemplate(template, values, { isSvg: true }),
  ) as any
}
