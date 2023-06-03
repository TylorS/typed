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

export type UpdateWorkerOptions = {
  readonly environment: Environment
  readonly isBot?: boolean
  readonly batchSize?: number
}

const DEFAULT_BATCH_SIZE = 10

export const withUpdateWorker = (
  options: UpdateWorkerOptions,
): Layer.Layer<GlobalThis, never, RenderContext> =>
  RenderContext.layerScoped(
    Effect.gen(function* ($) {
      const { environment, isBot = false, batchSize = DEFAULT_BATCH_SIZE } = options
      const ctx = RenderContext.make(environment, isBot)

      yield* $(Effect.forkScoped(Effect.forever(runUpdates(ctx.updates, batchSize))))

      return ctx
    }),
  )

export function runUpdates(
  updates: RenderContext['updates'],
  batchSize: number,
): Effect.Effect<Scope.Scope | GlobalThis, never, void> {
  return Effect.uninterruptibleMask((restore) =>
    Effect.gen(function* ($) {
      const deadline = yield* $(restore(whenIdle))
      const iterator = updates.entries()

      while (!deadline.didTimeout && deadline.timeRemaining() > 0) {
        const batch = getNextUpdates(updates, iterator, batchSize)

        if (batch.length === 0) {
          return
        }

        yield* $(Effect.allPar(batch))
      }
    }),
  )
}

function getNextUpdates(
  updates: RenderContext['updates'],
  iterator: IterableIterator<[Part<any, any>, Effect.Effect<never, never, unknown>]>,
  batchSize: number,
) {
  const output: Effect.Effect<never, never, unknown>[] = []

  for (let i = 0; i < batchSize; ++i) {
    const result = iterator.next()

    if (result.done) {
      break
    }

    const [part, update] = result.value

    output.push(
      Effect.ensuring(
        update,
        Effect.sync(() => updates.delete(part)),
      ),
    )
  }

  return output
}

export const whenIdle = Effect.asyncEffect<
  never,
  never,
  IdleDeadline,
  GlobalThis | Scope.Scope,
  never,
  void
>(
  Effect.serviceFunctionEffect(
    GlobalThis,
    (globalThis: GlobalThis) =>
      (resume: (_: Effect.Effect<never, never, IdleDeadline>) => void) => {
        // Try to utilize requestIdleCallback if available
        if (globalThis.requestIdleCallback) {
          const id = globalThis.requestIdleCallback((deadline) => resume(Effect.succeed(deadline)))

          return Effect.addFinalizer(() => Effect.sync(() => globalThis.cancelIdleCallback(id)))

          // Fallback to requestAnimationFrame
        } else if (globalThis.requestAnimationFrame) {
          const id = globalThis.requestAnimationFrame(() =>
            resume(Effect.succeed(mockIdleDeadline(50))),
          )

          return Effect.addFinalizer(() => Effect.sync(() => globalThis.cancelAnimationFrame(id)))
          // Fallback to setTimeout
        } else {
          const id = globalThis.setTimeout(() => resume(Effect.succeed(mockIdleDeadline(50))))

          return Effect.addFinalizer(() => Effect.sync(() => globalThis.clearTimeout(id)))
        }
      },
  ),
)

function mockIdleDeadline(duration: number): IdleDeadline {
  const start = Date.now()

  return {
    didTimeout: false,
    timeRemaining: () => Math.max(0, duration - (Date.now() - start)),
  }
}
