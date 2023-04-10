import type { Context } from '@effect/data/Context'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { Hole } from '../Hole.js'
import type { Placeholder } from '../Placeholder.js'
import { RenderCache } from '../RenderCache.js'
import type { RenderContext } from '../RenderContext.js'
import { getRenderHoleContext, renderHole } from '../render.js'

import * as Tag from './Effect.js'

// Tag functions which only accept and return Fx

export function html<Values extends Array<Placeholder<any, any> | undefined | null>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  if (values.length === 0) {
    return Fx.fromEffect(
      Effect.contextWith(
        (env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
          new Hole('html', env, template, values),
      ),
    )
  }

  return Fx.fromFxEffect(
    Effect.contextWith((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(template, values),
        Fx.map((values) => new Hole('html', env, template, values)),
      ),
    ),
  )
}

html.node = <Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<
  Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Node
> =>
  Fx.suspend<
    Document | RenderContext | Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Node
  >(() => {
    const cache = RenderCache()

    return pipe(
      html(template, ...values),
      Fx.switchMapEffect((hole) =>
        pipe(
          getRenderHoleContext,
          Effect.map((ctx) => renderHole(hole, cache, ctx).valueOf() as Node),
        ),
      ),
    )
  })

html.effect = Tag.html

export function svg<Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Fx.Fx<Placeholder.ResourcesOf<Values[number]>, Placeholder.ErrorsOf<Values[number]>, Hole> {
  if (values.length === 0) {
    return Fx.fromEffect(
      Effect.contextWith(
        (env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
          new Hole('svg', env, template, values),
      ),
    )
  }

  return Fx.fromFxEffect(
    Effect.contextWith((env: Context<Placeholder.ResourcesOf<Values[number]>>) =>
      pipe(
        unwrapFxValues(template, values),
        Fx.map((values) => new Hole('svg', env, template, values)),
      ),
    ),
  )
}

svg.node = <Values extends ReadonlyArray<Placeholder<any, any> | undefined | null>>(
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
      Fx.switchMapEffect((hole) =>
        pipe(
          getRenderHoleContext,
          Effect.map((ctx) => renderHole(hole, cache, ctx).valueOf() as Node),
        ),
      ),
    )
  })

svg.effect = Tag.svg

function unwrapFxValues<Values extends Array<Placeholder<any, any> | undefined | null>>(
  template: TemplateStringsArray,
  values: Values,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  Array<any>
> {
  return Fx.combineAll(...values.map((v, i) => unwrapFxValue(template, v, i))) as Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    Array<any>
  >
}

function unwrapFxValue(
  template: TemplateStringsArray,
  value: Placeholder<any, any> | undefined | null,
  index: number,
): Fx.Fx<any, any, any> {
  if (Fx.isFx(value) && !('element' in value)) {
    return value
  }

  if (Effect.isEffect(value)) {
    const prevParts = template[index].split(/\s/g)
    const prev = prevParts[prevParts.length - 1].trim()

    // Allow event listeners to be passed as Effects to be called when triggered
    // Otherwise the Effect is lifted into an Fx that is sampled whenever the Fx emits a value
    if (!prev.startsWith('on') && !prev.startsWith('@')) {
      return Fx.fromEffect<any, any, any>(value)
    }
  }

  return Fx.succeed(value)
}

declare module '@typed/fx' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Fx<R, E, A> extends Placeholder<R, E> {}
}
