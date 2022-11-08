import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Env } from '@tsplus/stdlib/service/Env'
import * as Fx from '@typed/fx'

import { isEffect, isFx } from '../_internal.js'

import { Hole } from './Hole.js'
import { Placeholder } from './Placeholder.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { Renderable } from './Renderable.js'
import { getRenderHoleContext, renderHole } from './render.js'

export function html<Values extends ReadonlyArray<Renderable>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  return Fx.fromFxEffect(
    Effect.environmentWith((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(values),
        Fx.map((values) => new Hole('html', env, template, values)),
      ),
    ),
  )
}

html.node = <Values extends ReadonlyArray<Renderable>>(
  template: TemplateStringsArray,
  ...values: [...Values]
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
  )

html.effect = <Values extends ReadonlyArray<Renderable.Effect>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Hole
> =>
  Effect.environmentWithEffect((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
    pipe(
      unwrapEffectValues(values),
      Effect.map((values) => new Hole('html', env, template, values)),
    ),
  )

export function svg<Values extends ReadonlyArray<Renderable>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  return Fx.fromFxEffect(
    Effect.environmentWith((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(values),
        Fx.map((values) => new Hole('svg', env, template, values)),
      ),
    ),
  )
}

svg.node = <Values extends ReadonlyArray<Renderable>>(
  template: TemplateStringsArray,
  ...values: [...Values]
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
  )

svg.effect = <Values extends ReadonlyArray<Renderable.Effect>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Hole
> =>
  Effect.environmentWithEffect((env: Env<Placeholder.ResourcesOf<Values[number]>>) =>
    pipe(
      unwrapEffectValues(values),
      Effect.map((values) => new Hole('svg', env, template, values)),
    ),
  )

function unwrapFxValues<Values extends Array<Renderable>>(
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<Renderable.Value>
> {
  // Used to sample pull-based Effect's whenever an Fx emits a value.
  const sampling = Fx.Subject.unsafeMake<never, void>()

  return Fx.combineAll(values.map((v) => unwrapFxValue(v, sampling))) as Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Array<Renderable.Value>
  >
}

function unwrapFxValue(
  value: Renderable,
  sampling: Fx.Subject<never, void>,
): Fx.Fx<any, any, Renderable.Value> {
  if (isFx(value)) {
    return pipe(
      value,
      Fx.tapEffect(() => sampling.emit()),
    )
  }

  if (isEffect(value)) {
    return pipe(
      Fx.fromEffect(value),
      Fx.continueWith(() =>
        pipe(
          sampling,
          Fx.mapEffect(() => value),
        ),
      ),
    )
  }

  if (Array.isArray(value)) {
    return pipe(
      unwrapFxValues(value),
      Fx.tapEffect(() => sampling.emit()),
    )
  }

  return Fx.succeed(value as Renderable.Value)
}

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
