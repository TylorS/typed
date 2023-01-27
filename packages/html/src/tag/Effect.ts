import * as Effect from '@effect/io/Effect'
import type { Context } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/core/Function'

import { Hole } from '../Hole.js'
import type { Placeholder } from '../Placeholder.js'
import { RenderCache } from '../RenderCache.js'
import type { RenderContext } from '../RenderContext.js'
import { getRenderHoleContext, renderHole } from '../render.js'

// Tag functions which only accept and return Effect

export function html<Values extends ReadonlyArray<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Hole
> {
  return Effect.contextWithEffect((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
    pipe(
      unwrapEffectValues(values),
      Effect.map((values) => new Hole('html', env, template, values)),
    ),
  )
}

html.node = <Values extends ReadonlyArray<Placeholder<any>>>(
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

export function svg<Values extends ReadonlyArray<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Hole
> {
  return Effect.contextWithEffect((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
    pipe(
      unwrapEffectValues(values),
      Effect.map((values) => new Hole('svg', env, template, values)),
    ),
  )
}

svg.node = <Values extends ReadonlyArray<Placeholder<any>>>(
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

function unwrapEffectValues<Values extends Array<Placeholder<any>>>(
  values: Values,
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<any>
> {
  return Effect.gen(function* ($) {
    const output: Array<any> = []

    for (let i = 0; i < values.length; i++) {
      const value = values[i]

      if (Effect.isEffect(value)) {
        output.push(
          yield* $(
            value as any as Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, any>,
          ),
        )
        continue
      }

      output.push(value)
    }

    return output
  })
}

declare module '@effect/io/Effect' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Effect<R, E, A> extends Placeholder<R, E> {}
}
