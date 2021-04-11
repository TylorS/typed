import { pipe } from 'cjs/function'
import { isRight } from 'fp-ts/Either'
import { isSome } from 'fp-ts/Option'

import * as E from './Env'
import {
  addFinalizer,
  CurrentFiber,
  Fiber,
  Finalizer,
  fork,
  getCurrentFiber,
  Status,
} from './Fiber'
import { Do, doEnv, toEnv } from './Fx/Env'
import { createReferences, References } from './Ref'
import { WeakKey, WeakKeyMap } from './WeakKey'

export interface Shared {
  readonly sharedReferences: SharedReferences
  readonly sharedFibers: SharedFibers
}

/**
 * A place to keep track of references for a given key over time. When forking a
 * new shared Fiber, the references will then be inherited at the time of forking and
 * will then be merged back into Shared when completed.
 */
export interface SharedReferences extends WeakKeyMap<References['references']> {}

/**
 *
 */
export interface SharedFibers extends WeakKeyMap<Fiber<unknown>> {}

export const getShared = E.ask<Shared>()

export const getSharedReferences = (key: WeakKey) =>
  Do(function* (_) {
    const { sharedReferences } = yield* _(getShared)

    if (!sharedReferences.has(key)) {
      sharedReferences.set(key, new Map())
    }

    return sharedReferences.get(key)!
  })

const isTerminal = <A>(status: Status<A>) =>
  status.type === 'aborting' || status.type === 'aborted' || status.type === 'completed'

export const getSharedFiber = <A>(key: WeakKey) =>
  Do(function* (_) {
    const { sharedFibers } = yield* _(getShared)
    const fiber = sharedFibers.get(key)

    if (fiber) {
      const status = yield* _(() => fiber.status)

      if (!isTerminal(status)) {
        return fiber as Fiber<A>
      }
    }
  })

export type ForkSharedOptions = {
  readonly key: WeakKey

  readonly id?: PropertyKey
  readonly abort?: boolean
}

export const forkShared = <E, A>(env: E.Env<E, A>, options: ForkSharedOptions) =>
  Do(function* (_) {
    const { key, id, abort = true } = options
    const shared = yield* _(getShared)
    const { sharedFibers } = shared
    const currentFiber = sharedFibers.get(key)

    // Abort the current fiber if configured to do so
    if (currentFiber && abort) {
      yield* _(() => currentFiber.abort)
    }

    // Only allow a single fiber to be running
    if (currentFiber && !abort) {
      return currentFiber
    }

    // Fork our fiber with the shared references
    return yield* createSharedFiber(key, env, shared, id)
  })

const createSharedFiber = <E, A>(
  key: WeakKey,
  env: E.Env<E, A>,
  shared: Shared,
  id?: PropertyKey,
) =>
  doEnv(function* (_) {
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

    return fiber
  })

const sharedFiberFinalizer = <A>(key: WeakKey, shared: Shared): Finalizer<A> => (exitValue) =>
  toEnv(
    doEnv(function* (_) {
      const fiber = yield* _(getCurrentFiber)

      if (isSome(exitValue) && isRight(exitValue.value)) {
        // Save our updated references
        shared.sharedReferences.set(key, fiber.refs.references)
      }
    }),
  )
