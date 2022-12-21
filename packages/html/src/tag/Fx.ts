import * as Effect from '@effect/io/Effect'
import { Context } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'

import { Hole } from '../Hole.js'
import { Placeholder } from '../Placeholder.js'
import { RenderCache } from '../RenderCache.js'
import { RenderContext } from '../RenderContext.js'
import { Renderable } from '../Renderable.js'
import { getRenderHoleContext, renderHole } from '../render.js'

import * as Tag from './Effect.js'

// Tag functions which only accept and return Fx

export function html<
  Values extends ReadonlyArray<Renderable<any, any> | Fx.Fx<any, any, Renderable.Value<any>>>,
>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  return Fx.fromFxEffect(
    Effect.environmentWith((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(values),
        Fx.map((values) => new Hole('html', env, template, values)),
      ),
    ),
  )
}

html.node = <Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<
  Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Node
> =>
  Fx.suspend(() => {
    const cache = RenderCache()

    return pipe(
      html(template, ...values),
      Fx.exhaustMapLatestEffect((hole) =>
        pipe(
          getRenderHoleContext,
          Effect.map((ctx) => renderHole(hole, cache, ctx).valueOf() as Node),
        ),
      ),
    )
  })

html.effect = Tag.html

export function svg<Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  return Fx.fromFxEffect(
    Effect.environmentWith((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(values),
        Fx.map((values) => new Hole('svg', env, template, values)),
      ),
    ),
  )
}

svg.node = <Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<
  Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Node
> =>
  Fx.suspend(() => {
    const cache = RenderCache()
    return pipe(
      svg(template, ...values),
      Fx.exhaustMapLatestEffect((hole) =>
        pipe(
          getRenderHoleContext,
          Effect.map((ctx) => renderHole(hole, cache, ctx).valueOf() as Node),
        ),
      ),
    )
  })

svg.effect = Tag.svg

function unwrapFxValues<
  Values extends Array<Renderable<any, any> | Fx.Fx<any, any, Renderable.Value<any>>>,
>(
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<Renderable.Value<Placeholder.ResourcesOf<Values[number]>>>
> {
  // Used to sample pull-based Effect's whenever an Fx emits a value.
  const sampling = Fx.Subject.unsafeMake<never, void>()

  return Fx.combineAll(...values.map((v) => unwrapFxValue(v, sampling))) as Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Array<Renderable.Value<Placeholder.ResourcesOf<Values[number]>>>
  >
}

function unwrapFxValue(
  value: Renderable<any, any> | Fx.Fx<any, any, Renderable.Value<any>>,
  sampling: Fx.Subject<never, void>,
): Fx.Fx<any, any, Renderable.Value<any>> {
  if (Fx.isFx<any, any, any>(value)) {
    return pipe(
      value,
      Fx.tap(() => sampling.event()),
    )
  }

  if (Effect.isEffect(value)) {
    return pipe(
      Fx.fromEffect<any, any, any>(value),
      Fx.continueWith(() =>
        pipe(
          sampling,
          Fx.exhaustMapLatest(() => Fx.fromEffect<any, any, any>(value)),
        ),
      ),
    )
  }

  if (Array.isArray(value)) {
    return pipe(
      unwrapFxValues(value),
      Fx.tap(() => sampling.event()),
    )
  }

  return Fx.succeed(value as Renderable.Value<any>)
}

declare module '@effect/io/Effect' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Effect<R, E, A> extends Placeholder<R, E> {}
}
