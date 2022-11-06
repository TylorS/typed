// TODO: Unroll Effects in templates
// TODO: for/node variants

import * as Effect from '@effect/core/io/Effect'

import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'

export function html<Values extends Array<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, Hole> {
  return Effect.environmentWith<Placeholder.ResourcesOf<Values[number]>, Hole>(
    (env) => new Hole('html', env, template, values),
  )
}

export function svg<Values extends Array<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, Hole> {
  return Effect.environmentWith<Placeholder.ResourcesOf<Values[number]>, Hole>(
    (env) => new Hole('svg', env, template, values),
  )
}
