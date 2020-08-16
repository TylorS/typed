import { pipe } from 'fp-ts/es6/function'
import { Iso } from 'monocle-ts'

import { Arity1 } from '../common'
import { doEffect, Effect, map } from '../Effect'
import { HookEnv, UseState } from './HookEnvironment'
import { useMemo } from './useMemo'

export const useIso = <A, B>(
  iso: Iso<A, B>,
  [getA, updateA]: UseState<A>,
): Effect<HookEnv, UseState<B>> =>
  doEffect(function* () {
    const getB = yield* useMemo((l, g) => map(l.get, g), [iso, getA] as const)
    const updateB = yield* useMemo(
      (l, ua) => <E>(ub: Arity1<B, Effect<E, B>>) =>
        map(
          l.get,
          ua((a) => pipe(a, l.get, ub, map(l.reverseGet))),
        ),
      [iso, updateA] as const,
    )

    return [getB, updateB] as const
  })
