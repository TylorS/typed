import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Env } from '@tsplus/stdlib/service/Env'

import { isEffect } from '../_internal.js'

import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { Renderable } from './Renderable.js'
import { getRenderHoleContext, renderHole } from './render.js'

// Tag functions which only accept and return Effect

export function html<Values extends ReadonlyArray<Renderable.Effect>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Hole
> {
  return Effect.environmentWithEffect((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
    pipe(
      unwrapEffectValues(values),
      Effect.map((values) => new Hole('html', env, template, values)),
    ),
  )
}

html.node = <Values extends ReadonlyArray<Renderable.Effect>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Node
> =>
  pipe(
    html(template, ...values),
    Effect.flatMap((hole) =>
      pipe(
        getRenderHoleContext,
        Effect.map((ctx) => renderHole(hole, RenderCache(), ctx).valueOf() as Node),
      ),
    ),
  )

export function svg<Values extends ReadonlyArray<Renderable.Effect>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Hole
> {
  return Effect.environmentWithEffect((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
    pipe(
      unwrapEffectValues(values),
      Effect.map((values) => new Hole('svg', env, template, values)),
    ),
  )
}

svg.node = <Values extends ReadonlyArray<Renderable.Effect>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Node
> =>
  pipe(
    svg(template, ...values),
    Effect.flatMap((hole) =>
      pipe(
        getRenderHoleContext,
        Effect.map((ctx) => renderHole(hole, RenderCache(), ctx).valueOf() as Node),
      ),
    ),
  )

function unwrapEffectValues<Values extends Array<Renderable.Effect>>(
  values: Values,
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<Renderable.Value>
> {
  return Effect.gen(function* ($) {
    const output: Array<Renderable.Value> = []

    for (let i = 0; i < values.length; i++) {
      const value = values[i]

      if (isEffect(value)) {
        output.push(yield* $(value))
        continue
      }

      if (Array.isArray(value)) {
        output.push(yield* $(unwrapEffectValues(value)))
        continue
      }

      output.push(value as Renderable.Value)
    }

    return output
  })
}
