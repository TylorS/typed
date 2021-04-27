import { Env, fromIO } from '@fp/Env'
import { Eq } from '@fp/Eq'
import { CurrentFiber, Fiber, Fork, fork, usingFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { createReferences } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'
import { tuple } from 'fp-ts/Eq'

import { DepsArgs, getDeps } from './Deps'
import { resetIndex } from './HookIndex'
import { useEq } from './useEq'
import { useMemo } from './useMemo'
import { useRef } from './useRef'

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
      const [deps, eqs] = getDeps(args)
      const refs = yield* _(useMemo(fromIO(() => createReferences())))
      const fiberRef = yield* _(useRef(fork(env, { refs })))
      const isEqual = yield* _(useEq(deps, tuple(...eqs)))

      if (!isEqual) {
        yield* _(() => fiberRef.current.abort)
        yield* _(() => resetIndex({ refs }))

        fiberRef.current = yield* _(fork(env, { refs }))
      }

      return fiberRef.current
    }),
  )
}
