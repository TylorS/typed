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

function unwrapFxValues<Values extends Array<Renderable>>(
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<Renderable.Value>
> {
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
