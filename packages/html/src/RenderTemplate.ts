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
    isSvg: boolean,
  ) => Fx<
    Scope | Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Rendered
  >
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
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values, false))
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
  return html.as<SVGElement>()(template, ...values)
}
