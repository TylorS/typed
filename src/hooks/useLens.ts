import { Arity1 } from '@typed/fp/common'
import { doEffect, Effect, map } from '@typed/fp/Effect'
import { pipe } from 'fp-ts/es6/function'
import { Lens } from 'monocle-ts/es6/Lens'

import { HookEnv, UseState } from './HookEnvironment'
import { useMemo } from './useMemo'

export function useLens<A, B>(
  lens: Lens<A, B>,
  [getA, updateA]: UseState<A>,
): Effect<HookEnv, UseState<B>> {
  return doEffect(function* () {
    const getB = yield* useMemo((l, g) => map(l.get, g), [lens, getA] as const)
    const updateB = yield* useMemo(
      (l, ua) => <E>(ub: Arity1<B, Effect<E, B>>) =>
        doEffect(function* () {
          const updatedA = yield* ua<E>((a) =>
            doEffect(function* () {
              return pipe(a, l.set(yield* ub(l.get(a))))
            }),
          )

          return l.get(updatedA)
        }),
      [lens, updateA] as const,
    )

    return [getB, updateB] as const
  })
}
