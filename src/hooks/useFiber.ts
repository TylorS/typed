import * as E from '@fp/Env'
import { Eq } from '@fp/Eq'
import { CurrentFiber, DoF, Fiber, Fork, fork } from '@fp/Fiber'
import { References } from '@fp/Ref'
import { pipe } from 'fp-ts/function'

import { useDeps } from './Deps'
import { resetIndex } from './HookIndex'
import { useRef } from './useRef'

export function useFiber<E, A, Deps extends ReadonlyArray<any> = []>(
  env: E.Env<E, A>,
  options: UseFiberOptions<Deps> = {},
): E.Env<E & Fork & CurrentFiber, Fiber<A>> {
  const { deps, eqs, refs, id = Symbol('UseFiber'), abort = true } = options

  return DoF(function* (_) {
    const fiberRef = yield* pipe(fork(env, { refs, id, withRefs: resetIndex }), useRef, _)
    const isEqual = yield* _(useDeps(deps, eqs))

    if (!isEqual) {
      const current = yield* _(fiberRef.get)

      if (abort) {
        yield* _(() => current.abort)
      }

      const next = yield* _(() => current.clone({ inheritRefs: true, withRefs: resetIndex }))

      return yield* _(fiberRef.set(next))
    }

    return yield* _(fiberRef.get)
  })
}

export type UseFiberOptions<Deps extends ReadonlyArray<any>> = {
  readonly deps?: Deps
  readonly eqs?: { readonly [K in keyof Deps]: Eq<Deps[K]> }
  readonly refs?: References
  readonly id?: PropertyKey
  readonly abort?: boolean
}
