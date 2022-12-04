import { make } from '@fp-ts/data/mutable/MutableRef'

import * as Effect from '../Effect/index.js'
import { Future, pending } from '../Future.js'

export interface RefCounter {
  readonly refCount: Effect.Effect.Of<number>
  readonly increment: Effect.Effect.Of<number>
  readonly decrement: Effect.Effect.Of<number>
  readonly wait: Effect.Effect.Of<void>
}

export function RefCounter(initialCount: number): RefCounter {
  const ref = make(initialCount)
  const waiters: Set<Future.Of<void>> = new Set()

  return {
    refCount: Effect.sync(() => ref.get()),
    increment: Effect.sync(() => ref.updateAndGet((n) => n + 1)),
    decrement: Effect.sync(() => {
      const amount = ref.updateAndGet((n) => Math.max(0, n - 1))

      if (amount === 0 && waiters.size > 0) {
        waiters.forEach((f) => f.complete(Effect.unit))
        waiters.clear()
      }

      return amount
    }),
    wait: Effect.lazy(() => {
      if (ref.get() === 0) {
        return Effect.unit
      }

      const waiter = pending.of<void>()

      waiters.add(waiter)

      return Effect.wait(waiter)
    }),
  }
}
