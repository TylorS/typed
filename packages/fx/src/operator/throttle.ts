import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { suspend } from '../constructor/suspend.js'

import { filterEffect } from './filterEffect.js'

export function throttle(duration: Duration.Duration) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> =>
    suspend(() => {
      let scheduledFiber: Fiber.RuntimeFiber<never, unknown> | undefined

      const shouldThrottle = Effect.gen(function* ($) {
        if (scheduledFiber) {
          return false
        }

        scheduledFiber = yield* $(
          pipe(
            Effect.unit(),
            Effect.delay(duration),
            Effect.tap(() =>
              Effect.sync(() => {
                scheduledFiber = undefined
              }),
            ),
            Effect.fork,
          ),
        )

        return true
      })

      return pipe(
        fx,
        filterEffect(() => shouldThrottle),
      )
    })
}
