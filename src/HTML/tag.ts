// HTML + SVG template tags w/ Fx output ??

// Event handling w/ Effect
// Fork lit-html vscode plugin for new features
// for/node variants
// Holes should be created with a reference to their Environment + Fiber Info

import * as Effect from '@effect/core/io/Effect'

import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'

export function html<Values extends Array<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, Hole> {
  return Effect.environmentWith<Placeholder.ResourcesOf<Values[number]>, Hole>(
    (env): Hole => new Hole('html', env, template, values),
  )
}

export function svg<Values extends Array<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, Hole> {
  return Effect.environmentWith<Placeholder.ResourcesOf<Values[number]>, Hole>(
    (env): Hole => new Hole('svg', env, template, values),
  )
}
