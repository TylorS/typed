import * as Deferred from '@effect/core/io/Deferred'
import * as Effect from '@effect/core/io/Effect'
import { interrupt } from '@effect/core/io/Fiber'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

export const waitForElements =
  (...selectors: readonly [string, ...string[]]) =>
  <R, E>(fx: Fx.Fx<R, E, HTMLElement>) =>
    Effect.gen(function* ($) {
      const deferred = yield* $(Deferred.make<never, HTMLElement>())
      const remaining = new Set(selectors)

      const checkForRemainingSelectors = (element: HTMLElement) => {
        remaining.forEach((selector) => {
          const child = element.querySelector(selector)

          if (child) {
            remaining.delete(selector)
          }
        })

        if (remaining.size === 0) {
          deferred.unsafeDone(Effect.succeed(element))
        }
      }

      const fiber = yield* $(
        pipe(
          fx,
          Fx.runObserve((el) => Effect.sync(() => checkForRemainingSelectors(el))),
          Effect.fork,
        ),
      )

      const element = yield* $(deferred.await)

      yield* $(interrupt(fiber))

      return element
    })
