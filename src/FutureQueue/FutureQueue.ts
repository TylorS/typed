import { pipe } from 'fp-ts/function'

import { FiberId } from '@/FiberId'
import { complete, Future, pending } from '@/Future'
import { disposed, Fx } from '@/Fx'

/**
 * A Future Queue is a synchronously used Queue for managing Futures that need to be handled in FIFO ordering.
 */
export interface FutureQueue<R, E, A> {
  readonly size: () => number
  readonly next: (value: Fx<R, E, A>) => void
  readonly waitFor: (amount: number) => ReadonlyArray<Future<R, E, A>>
  readonly dispose: (fiberId: FiberId) => void
}

/**
 * Constructs a FutureQueue
 */
export function make<R, E, A>(): FutureQueue<R, E, A> {
  const queue: Array<Future<R, E, A>> = []

  function next(fx: Fx<R, E, A>) {
    if (queue.length > 0) {
      const future = queue.shift()!

      pipe(future, complete(fx))
    }
  }

  function waitFor(amount: number): ReadonlyArray<Future<R, E, A>> {
    const pendingFutures = Array.from({ length: amount }, () => pending<R, E, A>())

    queue.push(...pendingFutures)

    return pendingFutures
  }

  function dispose(fiberId: FiberId) {
    if (queue.length > 0) {
      queue.forEach(complete(disposed<E, A>(fiberId) as Fx<R, E, A>))
    }
  }

  return {
    size: () => queue.length,
    next,
    waitFor,
    dispose,
  } as const
}
