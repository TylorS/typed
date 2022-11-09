import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as T from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import type { RenderCache } from './RenderCache.js'
import type { TemplateCache } from './TemplateCache.js'

export interface RenderContext {
  readonly renderCache: WeakMap<HTMLElement | DocumentFragment, RenderCache>
  readonly templateCache: WeakMap<TemplateStringsArray, TemplateCache>
}

export function RenderContext(): RenderContext {
  return {
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
  }
}

export namespace RenderContext {
  export const Tag: T.Tag<RenderContext> = T.Tag<RenderContext>()

  export const get = Effect.service(Tag)

  export const live: Layer.Layer<never, never, RenderContext> = Layer.fromEffect(Tag)(
    Effect.sync(RenderContext),
  )

  export const provide: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
  ) => Effect.Effect<Exclude<R, RenderContext>, E, A> = Effect.provideSomeLayer(live)
  export const provideFx = Fx.provideSomeLayer(live)
}
