import { Env } from '@tsplus/stdlib/service/Env'

import { Hole } from './Hole.js'
import { Renderable } from './Renderable.js'

// Tag functions which only accept and return Hole's directly with no environment needs.

export function html<Values extends ReadonlyArray<Renderable.Value<never>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Hole {
  return new Hole('html', Env.empty, template, values)
}

export function svg<Values extends ReadonlyArray<Renderable.Value<never>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Hole {
  return new Hole('svg', Env.empty, template, values)
}
