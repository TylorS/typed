import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Env } from '@tsplus/stdlib/service/Env'

import { isEffect } from '../_internal.js'

import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { renderHole } from './render.js'

export const html = Object.assign(
  function html<Values extends Array<Placeholder<any> | Effect.Effect<any, any, Placeholder<any>>>>(
    template: TemplateStringsArray,
    ...values: Values
  ): Effect.Effect<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Hole
  > {
    return Effect.environmentWithEffect((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapValues(values),
        Effect.map((values) => new Hole('html', env, template, values)),
      ),
    )
  },
  {
    node: <Values extends Array<Placeholder<any> | Effect.Effect<any, any, Placeholder<any>>>>(
      template: TemplateStringsArray,
      ...values: Values
    ): Effect.Effect<
      Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
      Placeholder.ErrorsOf<Values[number]>,
      Node
    > =>
      pipe(
        html(template, ...values),
        Effect.flatMap((hole) => renderHole(hole, RenderCache())),
        Effect.map((fragment) => fragment.valueOf() as Node),
      ),
  },
)

export const svg = Object.assign(
  function svg<Values extends Array<Placeholder<any> | Effect.Effect<any, any, Placeholder<any>>>>(
    template: TemplateStringsArray,
    ...values: Values
  ): Effect.Effect<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Hole
  > {
    return Effect.environmentWithEffect((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapValues(values),
        Effect.map((values) => new Hole('svg', env, template, values)),
      ),
    )
  },
  {
    node: <Values extends Array<Placeholder<any> | Effect.Effect<any, any, Placeholder<any>>>>(
      template: TemplateStringsArray,
      ...values: Values
    ): Effect.Effect<
      Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
      Placeholder.ErrorsOf<Values[number]>,
      Node
    > =>
      pipe(
        svg(template, ...values),
        Effect.flatMap((hole) => renderHole(hole, RenderCache())),
        Effect.map((fragment) => fragment.valueOf() as Node),
      ),
  },
)

function unwrapValues<
  Values extends Array<Placeholder<any> | Effect.Effect<any, any, Placeholder<any>>>,
>(
  values: Values,
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<Placeholder<any>>
> {
  return pipe(
    Effect.forEachPar(values, unwrapValue),
    Effect.map((x) => Array.from(x)),
  )
}

function unwrapValue(
  value: Placeholder<any> | Effect.Effect<any, any, Placeholder<any>>,
): Effect.Effect<any, any, Placeholder<any>> {
  if (isEffect(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return unwrapValues(value)
  }

  return Effect.succeed(value as Placeholder<any>)
}
