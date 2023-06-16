import * as Effect from '@effect/io/Effect'
import * as Context from '@typed/context'

export interface RenderContext {
  readonly environment: 'server' | 'browser' | 'static' | 'test'
  readonly isBot: boolean

  readonly renderCache: WeakMap<object, unknown>
  readonly templateCache: WeakMap<TemplateStringsArray, unknown>
}

export type Environment = RenderContext['environment']

export const RenderContext = Context.Tag<RenderContext>('@typed/html/RenderContext')

export function makeRenderContext(
  environment: RenderContext['environment'],
  isBot: RenderContext['isBot'] = false,
): RenderContext {
  return {
    environment,
    isBot,
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
  }
}

export const isStatic: Effect.Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'static',
)

export const isBrowser: Effect.Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'browser',
)

export const isServer: Effect.Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'server',
)

export const isTest: Effect.Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'test',
)

export const isBot: Effect.Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.isBot,
)
