import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as T from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'
import { pipe } from 'node_modules/@tsplus/stdlib/data/Function.js'

import type { RenderCache } from './RenderCache.js'
import type { TemplateCache } from './TemplateCache.js'

export interface RenderContext {
  readonly environment: 'server' | 'client'
  readonly renderCache: WeakMap<HTMLElement | DocumentFragment, RenderCache>
  readonly templateCache: WeakMap<TemplateStringsArray, TemplateCache>
}

export function RenderContext(environment: RenderContext['environment']): RenderContext {
  return {
    environment,
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
  }
}

export namespace RenderContext {
  export const Tag: T.Tag<RenderContext> = T.Tag<RenderContext>()

  export const get = Effect.service(Tag)

  export const client: Layer.Layer<never, never, RenderContext> = Layer.fromEffect(Tag)(
    Effect.sync(() => RenderContext('client')),
  )

  export const server: Layer.Layer<never, never, RenderContext> = Layer.fromEffect(Tag)(
    Effect.sync(() => RenderContext('server')),
  )

  export const provideClient: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
  ) => Effect.Effect<Exclude<R, RenderContext>, E, A> = Effect.provideSomeLayer(client)

  export const provideClientFx = Fx.provideSomeLayer(client)

  export const provideServer: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
  ) => Effect.Effect<Exclude<R, RenderContext>, E, A> = Effect.provideSomeLayer(server)

  export const provideServerFx = Fx.provideSomeLayer(server)
}

export const isClient = pipe(
  RenderContext.get,
  Effect.map((ctx) => ctx.environment === 'client'),
)

export const isServer = pipe(
  RenderContext.get,
  Effect.map((ctx) => ctx.environment === 'server'),
)
