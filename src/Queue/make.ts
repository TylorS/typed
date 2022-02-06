import { FiberId } from '@/FiberId'
import { flow, pipe } from '@/function'
import * as Future from '@/Future'
import * as Fx from '@/Fx'
import { isNonEmpty } from '@/NonEmptyArray'
import { isSome, None, Option, Some } from '@/Option'
import * as Ref from '@/Ref'

import { makeDroppingStategy } from './DroppingStrategy'
import { makeMutableQueue } from './MutableQueue'
import { Queue } from './Queue'
import { QueueStrategy } from './QueueStrategy'
import { makeSlidingStategy } from './SlidingStrategy'
import { makeSuspendStrategy } from './SuspendStrategy'
import { makeUnboundedStategy } from './UnboundedStrategy'
import { makeWaitFor, WaitFor } from './WaitFor'

export function make<A>(strategy: QueueStrategy<A>): Queue<unknown, never, A> {
  const mutableQueue = makeMutableQueue<A>()
  const offers = makeWaitFor<A>()
  const takers = makeWaitFor<A>()
  const shutdownBy = Ref.make(Fx.of<Option<FiberId>>(None))

  const disposeIfShutdown = Fx.Fx(function* () {
    const disposedBy = yield* shutdownBy.get

    if (isSome(disposedBy)) {
      yield* Fx.disposed(disposedBy.value)
    }
  })

  const size = pipe(
    mutableQueue.get,
    Fx.map((x) => x.length),
  )

  const enqueue = (...values: A[]) =>
    Fx.Fx(function* () {
      yield* disposeIfShutdown

      const size = takers.size()

      // If there are takers waiting to dequeue a value push to them first
      runRemaining(values, takers)

      // Offer any additional values leftover
      if (isNonEmpty(values)) {
        const current = yield* mutableQueue.get

        return yield* strategy.offer(values, current, offers)
      }

      return size > 0 || values.length > 0
    })

  const poll = Fx.Fx(function* () {
    yield* disposeIfShutdown

    const current = yield* mutableQueue.get

    if (isNonEmpty(current)) {
      const value = current.shift()!

      // Let any suspended offerings resume
      offers.next(Fx.of(value))

      return Some(value)
    }

    return None
  })

  const dequeue = Fx.Fx(function* () {
    yield* disposeIfShutdown

    const current = yield* mutableQueue.get

    if (isNonEmpty(current)) {
      const value = current.shift()!

      // Let any suspended offerings resume
      offers.next(Fx.of(value))

      return value
    }

    const [future] = takers.waitFor(1)

    return yield* Future.wait(future)
  })

  const dequeueAll = Fx.Fx(function* () {
    yield* disposeIfShutdown

    const current = yield* mutableQueue.get

    yield* mutableQueue.update(() => Fx.of([]))

    // Let any suspended offerings resume
    for (const value of current) {
      offers.next(Fx.of(value))
    }
    return current
  })

  const dequeueUpTo = (amount: number) =>
    Fx.Fx(function* () {
      yield* disposeIfShutdown

      const current = yield* mutableQueue.get
      const dequeued = current.splice(0, amount)

      // Let any suspended offerings resume
      for (const value of dequeued) {
        offers.next(Fx.of(value))
      }

      return dequeued
    })

  const shutdown = Fx.Fx(function* () {
    yield* disposeIfShutdown

    const { fiberId } = yield* Fx.getContext()

    // Record the FiberId that shutdown the Queue
    yield* shutdownBy.update(() => Fx.of(Some(fiberId)))

    // Immediately dispose of all suspended Fibers
    offers.dispose(fiberId)
    takers.dispose(fiberId)
  })

  const isShutdown = pipe(shutdownBy.get, Fx.map(isSome))

  return {
    capacity: strategy.capacity,
    size,
    enqueue,
    poll,
    dequeue,
    dequeueAll,
    dequeueUpTo,
    shutdown,
    isShutdown,
  }
}

export const unbounded = flow(makeUnboundedStategy, make)
export const dropping = flow(makeDroppingStategy, make)
export const sliding = flow(makeSlidingStategy, make)
export const suspend = flow(makeSuspendStrategy, make)

const runRemaining = <A>(current: A[], waitFor: WaitFor<A>) => {
  // Let any suspended offerings resume
  for (let i = 0; i < Math.min(current.length, waitFor.size()); ++i) {
    waitFor.next(Fx.of(current.shift()!))
  }
}
