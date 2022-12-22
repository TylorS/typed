import * as Effect from '@effect/io/Effect'
import { Context } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'

import { Hole } from '../Hole.js'
import { Placeholder } from '../Placeholder.js'
import { RenderCache } from '../RenderCache.js'
import { RenderContext } from '../RenderContext.js'
import { getRenderHoleContext, renderHole } from '../render.js'

import * as Tag from './Effect.js'

// Tag functions which only accept and return Fx

export function html<Values extends Array<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  return Fx.fromFxEffect(
    Effect.environmentWith((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(template, values),
        Fx.map((values) => new Hole('html', env, template, values)),
      ),
    ),
  )
}

html.node = <Values extends ReadonlyArray<Placeholder<any>>>(
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

export function svg<Values extends ReadonlyArray<Placeholder<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  return Fx.fromFxEffect(
    Effect.environmentWith((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(template, values),
        Fx.map((values) => new Hole('svg', env, template, values)),
      ),
    ),
  )
}

svg.node = <Values extends ReadonlyArray<Placeholder<any>>>(
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

function unwrapFxValues<Values extends Array<Placeholder<any>>>(
  template: TemplateStringsArray,
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<any>
> {
  // Used to sample pull-based Effect's whenever an Fx emits a value.
  const sampling = Fx.Subject.unsafeMake<never, void>()

  return Fx.combineAll(...values.map((v, i) => unwrapFxValue(template, v, i, sampling))) as Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Array<any>
  >
}

function unwrapFxValue(
  template: TemplateStringsArray,
  value: Placeholder<any>,
  index: number,
  sampling: Fx.Subject<never, void>,
): Fx.Fx<any, any, any> {
  if (Fx.isFx<any, any, any>(value) && !('element' in value)) {
    return pipe(
      value,
      Fx.tap(() => sampling.event()),
    )
  }

  if (Effect.isEffect(value)) {
    const prevParts = template[index].split(/\s/g)
    const prev = prevParts[prevParts.length - 1].trim()

    // Allow event listeners to be passed as Effects to be called when triggered
    if (!prev.startsWith('on')) {
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
  }

  return Fx.succeed(value)
}

declare module '@typed/fx' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Fx<R, E, A> extends Placeholder<R, E> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Variance<R, E, A> extends Placeholder<R, E> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface MulticastFx<R, E, A> extends Placeholder<R, E> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface HoldFx<R, E, A> extends Placeholder<R, E> {}
}
