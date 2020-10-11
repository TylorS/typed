import { Arity1 } from '@typed/fp/common/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { Match } from '@typed/fp/logic/exports'
import { Ref } from '@typed/fp/SharedRef/exports'
import { identity } from 'fp-ts/function'
import { isNone, none, some } from 'fp-ts/Option'

import { useEffectBy, useMatches } from '../additional/exports'
import { useMemo } from '../core/exports'
import { useKeyManager } from './useKeyManager'

export function useMatchManager<
  A,
  B,
  C,
  Matches extends ReadonlyArray<Match<A, Arity1<Ref<B | null | undefined>, Effect<any, C>>>>
>(value: A, ...matches: Matches) {
  const eff = doEffect(function* () {
    const modifiedMatches = yield* useMemo(
      (ms) => ms.map((m) => Match.map((c) => [m, c] as const, m)),
      [matches],
    )
    const option = yield* useMatches(value, ...modifiedMatches)
    const [c] = yield* useEffectBy([option], identity, (opt) =>
      doEffect(function* () {
        if (isNone(opt)) {
          return none
        }

        const [match, computation] = opt.value

        const x = yield* useKeyManager(match, computation)

        return some(x)
      }),
    )

    return c
  })

  return eff
}
