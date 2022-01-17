import { pipe } from 'fp-ts/function'
import { isSome, none, Option, some } from 'fp-ts/Option'

import { fromExit, getContext } from '@/Effect'
import { fork as forkFiber } from '@/Effect/Fork'
import { join } from '@/Effect/Join'
import { Fiber } from '@/Fiber/Fiber'
import { of as fiberFromValue } from '@/Fiber/of'
import { complete, Future, pending, wait } from '@/Future'
import * as Fx from '@/Fx'
import { Stream } from '@/Stream'
import * as Subject from '@/Subject'

import { FiberRef } from './FiberRef'

export interface FiberRefLocals {
  readonly get: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Fx.Fx<R, E, A>
  readonly has: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Fx.Of<boolean>
  readonly update: <R, E, A, R2, E2>(
    fiberRef: FiberRef<R, E, A>,
    f: (value: A) => Fx.Fx<R2, E2, A>,
  ) => Fx.Fx<R & R2, E | E2, A>
  readonly delete: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Fx.Fx<R, E, Option<A>>
  readonly values: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Stream<unknown, never, Option<A>>
  readonly fork: Fx.Of<FiberRefLocals>
  readonly inherit: Fx.Of<void>

  // Underlying state
  readonly refs: FiberRefMap
  readonly events: FiberRefEvents
}

export type FiberRefMap = Map<FiberRef<any, any, any>, Fiber<unknown, any>>

export type FiberRefEvents = WeakMap<
  FiberRef<any, any, any>,
  Subject.Subject<unknown, never, Option<any>>
>

export function makeFiberRefLocals(
  refs: FiberRefMap = new Map(),
  events: FiberRefEvents = new Map(),
): FiberRefLocals {
  const sendEvent = <R, E, A>(fiberRef: FiberRef<R, E, A>, value: Option<A>) => {
    if (events.has(fiberRef)) {
      const subject = events.get(fiberRef)!

      subject.event(value)
    }
  }

  const get = <R, E, A>(fiberRef: FiberRef<R, E, A>) =>
    Fx.Fx(function* () {
      // Get the currently set value if available
      if (refs.has(fiberRef)) {
        const fiber = refs.get(fiberRef)!
        const exit = yield* fiber.exit

        return yield* fromExit(exit)
      }

      // Fork a fiber to avoid multiple initializations
      const fiber: Fiber<E, A> = yield* forkFiber(fiberRef.initial)

      // Memoized
      refs.set(fiberRef, fiber)

      const a = yield* join(fiber)

      // Send created event
      sendEvent(fiberRef, some(a))

      return a
    })

  const has = <R, E, A>(fiberRef: FiberRef<R, E, A>) => Fx.fromIO(() => refs.has(fiberRef))

  // Allow only one update to be running at a time
  const updateQueue = new WeakMap<
    FiberRef<any, any, any>,
    { count: number; futures: Array<Future<unknown, never, any>> }
  >()

  const getOrCreateQueue = <R, E, A>(fiberRef: FiberRef<R, E, A>) => {
    if (updateQueue.has(fiberRef)) {
      return updateQueue.get(fiberRef)!
    }

    return updateQueue.set(fiberRef, { count: 0, futures: [] }).get(fiberRef)!
  }

  const waitForCurrent = <R, E, A>(fiberRef: FiberRef<R, E, A>) =>
    Fx.Fx(function* () {
      const queue = getOrCreateQueue(fiberRef)

      // Continue immediately if nothing in the Queue
      if (queue.count++ == 0) {
        return [yield* get(fiberRef), queue] as const
      }

      // Ensure updates are applied in order by waiting in a Queue
      const future = pending<unknown, never, A>()

      queue.futures.push(future)

      return [yield* wait(future), queue] as const
    })

  const update = <R, E, A, R2, E2>(
    fiberRef: FiberRef<R, E, A>,
    f: (current: A) => Fx.Fx<R2, E2, A>,
  ): Fx.Fx<R & R2, E | E2, A> =>
    Fx.Fx(function* () {
      const [current, queue] = yield* waitForCurrent(fiberRef)
      const updated = yield* f(current)

      // Always set the updated value
      refs.set(fiberRef, fiberFromValue(updated))

      // Send an update event if the value changes
      if (!fiberRef.Eq.equals(updated)(current)) {
        sendEvent(fiberRef, some(updated))
      }

      // Continue with any additional updates
      if (--queue.count > 0 && queue.futures.length > 0) {
        // Don't block the return of the updated value
        yield* forkFiber(Fx.fromIO(() => pipe(queue.futures.shift()!, complete(Fx.of(updated)))))
      }

      return updated
    })

  const remove = <R, E, A>(fiberRef: FiberRef<R, E, A>) =>
    Fx.Fx(function* () {
      if (!refs.has(fiberRef)) {
        return none
      }

      const current: A = yield* join(refs.get(fiberRef)!)

      refs.delete(fiberRef)

      // Send deleted event
      sendEvent(fiberRef, none)

      return some(current)
    })

  const values = <R, E, A>(fiberRef: FiberRef<R, E, A>): Stream<unknown, never, Option<A>> => {
    if (events.has(fiberRef)) {
      return events.get(fiberRef)!
    }

    const subject = Subject.make<Option<A>>()

    events.set(fiberRef, subject)

    return subject
  }

  const fork = Fx.Fx(function* () {
    const forked = yield* forkRefs(refs)

    return makeFiberRefLocals(forked)
  })

  const inherit = Fx.Fx(function* () {
    for (const [fiberRef, fiber] of refs) {
      const local = yield* join(fiber)
      const { locals } = yield* getContext<never>()

      yield* locals.update(fiberRef, (current) => Fx.of(fiberRef.Magma.concat(local)(current)))
    }
  })

  const locals: FiberRefLocals = {
    get,
    has,
    update,
    delete: remove,
    values,
    fork,
    inherit: inherit as FiberRefLocals['inherit'],
    refs,
    events,
  }

  return locals
}

export function forkRefs(refs: FiberRefMap) {
  return Fx.Fx(function* () {
    const forked: FiberRefMap = new Map()

    for (const [fiberRef, fiber] of refs) {
      const local = yield* join(fiber)
      const option = fiberRef.fork(local)

      if (isSome(option)) {
        forked.set(fiberRef, fiberFromValue(option.value))
      }
    }

    return forked
  })
}
