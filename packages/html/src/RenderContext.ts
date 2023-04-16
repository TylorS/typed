import type { Effect } from '@effect/io/Effect'
import * as Context from '@typed/context'

import type { RenderCache } from './RenderCache.js'
import type { TemplateCache } from './TemplateCache.js'

export interface RenderContext {
  readonly environment: 'server' | 'browser' | 'static'
  readonly isBot: boolean
  readonly renderCache: WeakMap<HTMLElement | DocumentFragment, RenderCache>
  readonly templateCache: WeakMap<TemplateStringsArray, TemplateCache>
}

export type Environment = RenderContext['environment']

export const RenderContext = Object.assign(
  Context.Tag<RenderContext>('@typed/html/RenderContext'),
  {
    make: function makeRenderContext(
      environment: RenderContext['environment'],
      isBot: RenderContext['isBot'] = false,
    ): RenderContext {
      return {
        environment,
        isBot,
        renderCache: new WeakMap(),
        templateCache: new WeakMap(),
      }
    },
  },
)

export const isStatic: Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'static',
)

export const isBrowser: Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'browser',
)

export const isServer: Effect<RenderContext, never, boolean> = RenderContext.with(
  (ctx) => ctx.environment === 'server',
)
