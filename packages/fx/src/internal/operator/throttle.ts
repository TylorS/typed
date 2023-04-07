import type { Fx } from '@typed/fx/internal/Fx'
import { suspend } from '@typed/fx/internal/constructor/suspend'
import { Effect, pipe } from '@typed/fx/internal/externals'
import type { Duration, Fiber } from '@typed/fx/internal/externals'
import { filterEffect } from '@typed/fx/internal/operator/filterMapEffect'

export function throttle<R, E, A>(self: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> {
  return suspend(() => {
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
          Effect.forkScoped,
        ),
      )

      return true
    })

    return pipe(
      self,
      filterEffect(() => shouldThrottle),
    )
  })
}
