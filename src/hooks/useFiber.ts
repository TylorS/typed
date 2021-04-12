import { Env } from '@fp/Env'
import { Eq } from '@fp/Eq'
import { CurrentFiber, Fiber, Fork, fork } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { Refs } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'
import { tuple } from 'fp-ts/Eq'

import { DepsArgs, getDeps } from './Deps'
import { useEq } from './useEq'
import { useRef } from './useRef'

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & Refs, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E & CurrentFiber, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & Refs, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E & SchedulerEnv, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & Refs, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any>>(
  env: Env<E & CurrentFiber & SchedulerEnv, A>,
  deps?: Deps,
  eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> },
): Env<E & Fork & Refs, Fiber<A>>

export function useFiber<E, A, Deps extends ReadonlyArray<any> = []>(
  env: Env<E, A>,
  ...args: DepsArgs<Deps>
) {
  return Do(function* (_) {
    const [deps, eqs] = getDeps(args)
    const ref = yield* _(useRef(fork(env)))
    const isEqual = yield* _(useEq(deps, tuple(...eqs)))

    if (!isEqual) {
      yield* _(() => ref.current.abort)

      ref.current = yield* _(fork(env))
    }

    return ref.current
  })
}
