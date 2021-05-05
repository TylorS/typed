import { Env, fromIO } from '@fp/Env'
import { Eq } from '@fp/Eq'
import { CurrentFiber, Fiber, Fork, fork, usingFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { createReferences, getRef, setRef } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'
import { pipe } from 'fp-ts/function'

import { DepsArgs, useDeps } from './Deps'
import { resetIndex } from './HookIndex'
import { useMemo } from './useMemo'
import { useRef } from './useRef'

const useRefs = useMemo(fromIO(createReferences))

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & CurrentFiber, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E & CurrentFiber, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & CurrentFiber, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E & SchedulerEnv, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & CurrentFiber, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E & CurrentFiber & SchedulerEnv, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & CurrentFiber, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any> = []>(
  env: Env<E, A>,
  ...args: DepsArgs<Deps>
): Env<E & Fork & CurrentFiber, Fiber<A>> {
  return usingFiberRefs(
    Do(function* (_) {
      const refs = yield* _(useRefs)
      const fiberRef = yield* pipe(fork(env, { refs }), useRef, _)
      const isEqual = yield* _(useDeps(...args))

      if (!isEqual) {
        const current = yield* _(getRef(fiberRef))

        yield* _(() => current.abort)
        yield* _(() => resetIndex({ refs }))

        const next = yield* _(fork(env, { refs }))

        yield* _(pipe(next, setRef(fiberRef)))
      }

      return yield* _(getRef(fiberRef))
    }),
  )
}
