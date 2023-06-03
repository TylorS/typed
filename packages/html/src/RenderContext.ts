import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Context from '@typed/context'
import { GlobalThis } from '@typed/dom'

import { RenderCache } from './RenderCache.js'
import type { TemplateCache } from './TemplateCache.js'
import type { Part } from './part/Part.js'

export interface RenderContext {
  readonly environment: 'server' | 'browser' | 'static' | 'test'
  readonly isBot: boolean
  readonly renderCache: RenderCache
  readonly templateCache: WeakMap<TemplateStringsArray, TemplateCache>
  // TODO: Consider creating a priority queue for updates
  readonly updates: Map<Part<any, any>, Effect.Effect<never, never, unknown>>
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
        renderCache: RenderCache(),
        templateCache: new WeakMap(),
        updates: new Map(),
      }
    },
  },
)

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

export const withUpdateWorker = (
  environment: RenderContext['environment'],
  isBot: RenderContext['isBot'] = false,
): Layer.Layer<GlobalThis, never, RenderContext> =>
  RenderContext.layerScoped(
    Effect.gen(function* ($) {
      const ctx = RenderContext.make(environment, isBot)

      if (environment === 'browser' || environment === 'test') {
        yield* $(Effect.forkScoped(Effect.forever(runUpdates(ctx.updates))))
      }

      return ctx
    }),
  )

export function runUpdates(
  updates: RenderContext['updates'],
): Effect.Effect<Scope.Scope | GlobalThis, never, void> {
  return Effect.gen(function* ($) {
    const globalThis = yield* $(GlobalThis)
    const deadline = yield* $(
      Effect.asyncEffect<never, never, IdleDeadline, Scope.Scope, never, void>((resume) =>
        Effect.suspend(() => {
          const id = globalThis.requestIdleCallback((deadline) => resume(Effect.succeed(deadline)))

          return Effect.addFinalizer(() => Effect.sync(() => globalThis.cancelIdleCallback(id)))
        }),
      ),
    )

    const iterator = updates.entries()

    while (!deadline.didTimeout && deadline.timeRemaining() > 0) {
      const result = iterator.next()

      if (result.done) {
        return
      }

      const [part, update] = result.value

      yield* $(update)
      updates.delete(part)
    }
  })
}
