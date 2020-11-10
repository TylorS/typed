import { whenIdle, WhenIdleEnv } from '@typed/fp/dom/exports'
import { Effect } from '@typed/fp/Effect/exports'
import { Queue } from '@typed/fp/Queue/exports'
import { isNone, isSome } from 'fp-ts/Option'

export type IdleScheduler = ReturnType<typeof createIdleScheduler>

export function createIdleScheduler<E, A>(queue: Queue<A>, f: (value: A) => Effect<E, void>) {
  let scheduled = false

  function* scheduleNextRun(): Effect<E & WhenIdleEnv, void> {
    if (scheduled) {
      return
    }

    scheduled = true

    const deadline = yield* whenIdle()
    const timeRemaining = () => deadline.timeRemaining() > 0 || deadline.didTimeout

    while (timeRemaining()) {
      const result = queue.dequeue()

      if (isNone(result)) {
        break
      }

      yield* f(result.value)

      if (isNone(queue.peek())) {
        break
      }
    }

    scheduled = false

    if (isSome(queue.peek())) {
      return yield* scheduleNextRun()
    }
  }

  return {
    get scheduled() {
      return scheduled
    },
    scheduleNextRun,
  } as const
}
