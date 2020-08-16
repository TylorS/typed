import { Eq, eqStrict } from 'fp-ts/es6/Eq'
import { getEq } from 'fp-ts/lib/ReadonlyArray'

import { doEffect, Effect, Fiber, FiberEnv, fork } from '../Effect'
import { Fn } from '../lambda'
import { HookEnv } from './HookEnvironment'
import { useHasChanged } from './useHasChanged'
import { useRef } from './useRef'

export function useFiber<A extends ReadonlyArray<any>, E, B>(
  fn: Fn<A, Effect<E, B>>,
  deps: A,
  eq: Eq<A> = getEq(eqStrict),
): Effect<E & HookEnv & FiberEnv, Fiber<B>> {
  return doEffect(function* () {
    const fiberRef = yield* useRef(fork(fn(...deps)))
    const hasChanged = yield* useHasChanged(deps, false, eq)
    const fiber = fiberRef.read()

    if (!hasChanged) {
      return fiber
    }

    fiber.dispose()

    const updated = yield* fork(fn(...deps))

    fiberRef.write(updated)()

    return updated
  })
}
