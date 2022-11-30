import { pipe } from '@fp-ts/data/Function'

import * as Effect from './Effect.js'
import { Future, pending } from './Future.js'
import { Scope, scoped } from './Scope.js'
import { ask } from './operators.js'

export interface Semaphore {
  readonly maxPermits: number
  readonly acquiredPermits: Effect.Effect<never, never, number>
  readonly availablePermits: Effect.Effect<never, never, number>
  readonly acquirePermit: Effect.Effect<Scope, never, void>
}

export function Semaphore(maxPermits: number): Semaphore {
  let acquired = 0
  const waiting: Array<Future<Scope, never, void>> = []

  const allocate = Effect.Effect(function* () {
    const scope = yield* ask(Scope)

    if (acquired < maxPermits) {
      acquired += 1

      yield* scope.addFinalizer(() => deallocate)

      return
    }

    const future = pending<Scope, never, void>()

    waiting.push(future)

    return yield* Effect.wait(future)
  })

  const deallocate = Effect.sync(() => {
    acquired -= 1

    waiting.shift()?.complete(allocate)
  })

  return {
    maxPermits,
    acquiredPermits: Effect.sync(() => acquired),
    availablePermits: Effect.sync(() => maxPermits - acquired),
    acquirePermit: allocate,
  }
}

export function Lock(): Semaphore {
  return Semaphore(1)
}

export function withPermit(semaphore: Semaphore) {
  return <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R, E, A> =>
    pipe(
      semaphore.acquirePermit,
      Effect.flatMap(() => effect),
      scoped,
    )
}
