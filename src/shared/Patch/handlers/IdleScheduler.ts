import { whenIdle, WhenIdleEnv } from '@typed/fp/dom/exports'
import { Effect } from '@typed/fp/Effect/exports'

export type IdleScheduler = ReturnType<typeof createIdleScheduler>

export function createIdleScheduler<E, A>(queue: Set<A>, f: (value: A) => Effect<E, void>) {
  let scheduled = false

  function* scheduleNextRun(): Effect<E & WhenIdleEnv, void> {
    if (scheduled) {
      return
    }

    scheduled = true

    const deadline = yield* whenIdle()
    const timeRemaining = () => deadline.timeRemaining() > 0 || deadline.didTimeout

    while (timeRemaining()) {
      const result = queue[Symbol.iterator]().next()

      if (result.done) {
        break
      }

      yield* f(result.value)

      if (queue.size === 0) {
        break
      }
    }

    if (queue.size > 0) {
      return yield* scheduleNextRun()
    }

    scheduled = false
  }

  return {
    get scheduled() {
      return scheduled
    },
    scheduleNextRun,
  } as const
}
