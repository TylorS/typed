import { whenIdle, WhenIdleEnv } from '@typed/fp/dom/exports'
import { doEffect, Effect, forever } from '@typed/fp/Effect/exports'
import { FiberEnv, pause } from '@typed/fp/fibers/exports'

export const whenIdleWorker = <E, A>(
  eff: Effect<E, A>,
): Effect<WhenIdleEnv & E & FiberEnv, never> =>
  forever(
    doEffect(function* () {
      const deadline = yield* whenIdle()

      while (deadline.timeRemaining() > 0) {
        yield* eff
      }

      yield* pause
    }),
  )
