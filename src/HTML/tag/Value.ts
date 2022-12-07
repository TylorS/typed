import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Env } from '@tsplus/stdlib/service/Env'

import { Hole } from '../Hole.js'
import { Placeholder } from '../Placeholder.js'
import { RenderCache } from '../RenderCache.js'
import { RenderContext } from '../RenderContext.js'
import { Renderable } from '../Renderable.js'
import { getRenderHoleContext, renderHole } from '../render.js'

// Tag functions which only accept and return resourceful placeholders

export function html<Values extends ReadonlyArray<Renderable.Value<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, Hole> {
  return Effect.environmentWith(
    (env: Env<Placeholder.ResourcesOf<Values[number]>>) => new Hole('html', env, template, values),
  )
}

html.node = <Values extends ReadonlyArray<Renderable.Value<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<Document | RenderContext | Placeholder.ResourcesOf<Values[number]>, never, Node> =>
  pipe(
    html(template, ...values),
    Effect.flatMap((hole) =>
      pipe(
        getRenderHoleContext,
        Effect.map((ctx) => renderHole(hole, RenderCache(), ctx).valueOf() as Node),
      ),
    ),
  )

export function svg<Values extends ReadonlyArray<Renderable.Value<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<Placeholder.ResourcesOf<Values[number]>, never, Hole> {
  return Effect.environmentWith(
    (env: Env<Placeholder.ResourcesOf<Values[number]>>) => new Hole('svg', env, template, values),
  )
}

svg.node = <Values extends ReadonlyArray<Renderable.Value<any>>>(
  template: TemplateStringsArray,
  ...values: [...Values]
): Effect.Effect<Document | RenderContext | Placeholder.ResourcesOf<Values[number]>, never, Node> =>
  pipe(
    svg(template, ...values),
    Effect.flatMap((hole) =>
      pipe(
        getRenderHoleContext,
        Effect.map((ctx) => renderHole(hole, RenderCache(), ctx).valueOf() as Node),
      ),
    ),
  )
