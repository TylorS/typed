import * as Effect from '@effect/io/Effect'
import * as Context from '@typed/context'

export interface RenderContext {
  /**
   * The current environment.
   */
  readonly environment: 'server' | 'browser' | 'static'

  /**
   * Whether or not the current render is for a bot.
   */
  readonly isBot: boolean

  /**
   * @internal
   */
  readonly renderCache: WeakMap<object, unknown>

  /**
   * @internal
   */
  readonly templateCache: WeakMap<TemplateStringsArray, unknown>
}

export type Environment = RenderContext['environment']

export const RenderContext = Context.Tag<RenderContext>('@typed/html/RenderContext')

export type RenderContextOptions = {
  readonly environment: RenderContext['environment']
  readonly isBot?: RenderContext['isBot']
}

export function makeRenderContext({
  environment,
  isBot = false,
}: RenderContextOptions): RenderContext {
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

export const isBot: Effect.Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.isBot,
)
