import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Env } from '@tsplus/stdlib/service/Env'
import * as Fx from '@typed/fx'

import { isEffect, isFx } from '../_internal.js'

import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { getRenderHoleContext, renderHole } from './render.js'

export const html = Object.assign(
  function html<
    Values extends Array<
      | Placeholder<any>
      | Effect.Effect<any, any, Placeholder<any>>
      | Fx.Fx<any, any, Placeholder<any>>
    >,
  >(
    template: TemplateStringsArray,
    ...values: Values
  ): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
    return Fx.fromFxEffect(
      Effect.environmentWith((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
        pipe(
          unwrapFxValues(values),
          Fx.map((values) => new Hole('html', env, template, values)),
        ),
      ),
    )
  },
  {
    node: <
      Values extends Array<
        | Placeholder<any>
        | Effect.Effect<any, any, Placeholder<any>>
        | Fx.Fx<any, any, Placeholder<any>>
      >,
    >(
      template: TemplateStringsArray,
      ...values: Values
    ): Fx.Fx<
      Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
      Placeholder.ErrorsOf<Values[number]>,
      Node
    > =>
      pipe(
        html(template, ...values),
        Fx.mapEffect((hole) =>
          pipe(
            getRenderHoleContext,
            Effect.map((ctx) => renderHole(hole, RenderCache(), ctx).valueOf() as Node),
          ),
        ),
      ),
  },
)
export const svg = Object.assign(
  function svg<
    Values extends Array<
      | Placeholder<any>
      | Effect.Effect<any, any, Placeholder<any>>
      | Fx.Fx<any, any, Placeholder<any>>
    >,
  >(
    template: TemplateStringsArray,
    ...values: Values
  ): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
    return Fx.fromFxEffect(
      Effect.environmentWith((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
        pipe(
          unwrapFxValues(values),
          Fx.map((values) => new Hole('svg', env, template, values)),
        ),
      ),
    )
  },
  {
    node: <
      Values extends Array<
        | Placeholder<any>
        | Effect.Effect<any, any, Placeholder<any>>
        | Fx.Fx<any, any, Placeholder<any>>
      >,
    >(
      template: TemplateStringsArray,
      ...values: Values
    ): Fx.Fx<
      Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
      Placeholder.ErrorsOf<Values[number]>,
      Node
    > =>
      pipe(
        svg(template, ...values),
        Fx.mapEffect((hole) =>
          pipe(
            getRenderHoleContext,
            Effect.map((ctx) => renderHole(hole, RenderCache(), ctx).valueOf() as Node),
          ),
        ),
      ),
  },
)

function unwrapFxValues<
  Values extends Array<
    Placeholder<any> | Effect.Effect<any, any, Placeholder<any>> | Fx.Fx<any, any, Placeholder<any>>
  >,
>(
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<Placeholder<any>>
> {
  return Fx.combineAll(values.map(unwrapFxValue)) as Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Array<Placeholder<any>>
  >
}

function unwrapFxValue(
  value:
    | Placeholder<any>
    | Effect.Effect<any, any, Placeholder<any>>
    | Fx.Fx<any, any, Placeholder<any>>,
): Fx.Fx<any, any, Placeholder<any>> {
  if (isFx(value)) {
    return value
  }

  if (isEffect(value)) {
    return Fx.fromEffect(value)
  }

  if (Array.isArray(value)) {
    return unwrapFxValues(value)
  }

  return Fx.succeed(value as Placeholder<any>)
}
