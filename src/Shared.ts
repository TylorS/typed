import { pipe } from '@fp/function'
import { isRight } from 'fp-ts/Either'
import { isSome, none, Option, some } from 'fp-ts/Option'

import * as E from './Env'
import {
  addDisposable,
  addFinalizer,
  CurrentFiber,
  Fiber,
  Finalizer,
  Fork,
  fork,
  getCurrentFiber,
  isTerminal,
} from './Fiber'
import { Do } from './Fx/Env'
import { Queue } from './Queue'
import { createReferences, References, RefId } from './Ref'
import { getScheduler, SchedulerEnv } from './Scheduler'
import { createSink } from './Stream'
import { WeakKey, WeakKeyMap } from './WeakKey'

/**
 * Shared is an abstraction for executing Fibers using a shared set of
 * references between invocations. When forking a shared Fiber, it will get
 * a clone of the currently held references (if any) and once the fiber completed running
 * and has been successful its updated references will be placed back into the SharedReferences.
 * This can be particularly useful if you're interested in doing some kind of patching
 */
export interface Shared {
  // The current state associated with a WeakKey
  readonly sharedReferences: SharedReferences
  // The latest fiber associated with a WeakKey
  readonly sharedFibers: SharedFibers
  //
  readonly sharedUpdates: Queue<WeakKey>
}

/**
 * A place to keep track of references for a given key over time. When forking a
 * new shared Fiber, the references will then be inherited at the time of forking and
 * will then be merged back into Shared when completed.
 */
export interface SharedReferences extends WeakKeyMap<References['references']> {}

/**
 * The currently running fiber for a given WeakKey
 */
export interface SharedFibers extends WeakKeyMap<Fiber<unknown>> {}

export const getShared = E.ask<Shared>()

export const getSharedReferences = (key: WeakKey): E.Env<Shared, ReadonlyMap<RefId, unknown>> =>
  Do(function* (_) {
    const { sharedReferences } = yield* _(getShared)

    if (!sharedReferences.has(key)) {
      sharedReferences.set(key, new Map())
    }

    return sharedReferences.get(key)!
  })

export const getSharedFiber = <A>(key: WeakKey): E.Env<Shared, Option<Fiber<A>>> =>
  Do(function* (_) {
    const { sharedFibers } = yield* _(getShared)
    const fiber = sharedFibers.get(key)

    if (fiber) {
      const status = yield* _(() => fiber.status)

      if (!isTerminal(status)) {
        return some(fiber as Fiber<A>)
      }
    }

    return none
  })

export type ForkSharedOptions = {
  readonly key: WeakKey

  readonly id?: PropertyKey
  readonly abort?: boolean
}

export const forkShared = <E, A>(
  env: E.Env<E, A>,
  options: ForkSharedOptions,
): E.Env<Shared & Fork & E & SchedulerEnv, Fiber<A>> =>
  Do(function* (_) {
    const { key, id, abort = true } = options
    const shared = yield* _(getShared)
    const currentFiber = yield* _(getSharedFiber(key))

    // If there is a current fiber that has not completed and we'd like not to
    // abort it we will return this fiber instead of creating a new instance
    if (isSome(currentFiber) && !abort) {
      return currentFiber.value as Fiber<A>
    }

    // Abort the current fiber if not already aborting or in a terminal status
    if (isSome(currentFiber) && abort) {
      yield* _(() => currentFiber.value.abort)
    }

    // Fork our fiber with the shared references
    return yield* _(
      createSharedFiber<E, A>({ key, env, shared, id }),
    )
  }) as any

type SharedFiberOpts<E, A> = {
  readonly key: WeakKey
  readonly env: E.Env<E, A>
  readonly shared: Shared
  readonly id?: PropertyKey
}

const createSharedFiber = <E, A>(opts: SharedFiberOpts<E, A>) =>
  Do(function* (_) {
    const { key, env, shared, id } = opts
    // Fork our fiber with the shared references
    const refs = yield* _(getSharedReferences(key))
    const fiber = yield* _(fork(env, { id, refs: createReferences(refs) }))

    // If/When the fiber is completes successfully ensure that references are saved to Shared environment
    // and the fiber is then removed from the SharedFibers WeakMap.
    yield* _(
      pipe(
        addFinalizer(sharedFiberFinalizer(key, shared)),
        E.useSome<CurrentFiber>({ currentFiber: fiber }),
      ),
    )

    const scheduler = yield* _(getScheduler)

    yield* _(
      pipe(
        addDisposable(
          // Listen to reference events
          fiber.refs.events.run(
            createSink({
              event: (_, x) => {
                // Enqueue for more work if not already queued
                if (x.type === 'updated' && !shared.sharedUpdates.some((x) => x === key)) {
                  shared.sharedUpdates.enqueue(key)
                }
              },
            }),
            scheduler,
          ),
        ),
        E.useSome<CurrentFiber>({ currentFiber: fiber }),
      ),
    )

    return fiber
  })

const sharedFiberFinalizer = <A>(key: WeakKey, shared: Shared): Finalizer<A> => (exitValue) =>
  Do(function* (_) {
    const fiber = yield* _(getCurrentFiber)

    // If successful, save our updated references
    if (isSome(exitValue) && isRight(exitValue.value)) {
      shared.sharedReferences.set(key, fiber.refs.references)
    }
  })
