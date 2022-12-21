import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'

import { RenderCache } from './RenderCache.js'
import { TemplateCache } from './TemplateCache.js'

export interface RenderContext {
  readonly environment: 'server' | 'browser'
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
  export const Tag: Context.Tag<RenderContext> = Context.Tag<RenderContext>()

  export const get = Effect.service(Tag)

  export const browser: Layer.Layer<never, never, RenderContext> = Layer.fromEffect(Tag)(
    Effect.sync(() => RenderContext('browser')),
  )

  export const server: Layer.Layer<never, never, RenderContext> = Layer.fromEffect(Tag)(
    Effect.sync(() => RenderContext('server')),
  )

  export const provideBrowser: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
  ) => Effect.Effect<Exclude<R, RenderContext>, E, A> = Effect.provideSomeLayer(browser)

  export const provideBrowserFx = Fx.provideSomeLayer(browser)

  export const provideServer: <R, E, A>(
    effect: Effect.Effect<R, E, A>,
  ) => Effect.Effect<Exclude<R, RenderContext>, E, A> = Effect.provideSomeLayer(server)

  export const provideServerFx = Fx.provideSomeLayer(server)
}

export const isBrowser = pipe(
  RenderContext.get,
  Effect.map((ctx) => ctx.environment === 'browser'),
)

export const isServer = pipe(
  RenderContext.get,
  Effect.map((ctx) => ctx.environment === 'server'),
)
