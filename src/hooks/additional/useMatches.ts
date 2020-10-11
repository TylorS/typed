import { doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'
import { Match, oneOf } from '@typed/fp/logic/exports'
import { Option } from 'fp-ts/lib/Option'

import { useMemo } from '../core/exports'

export function useMatches<A, Matches extends ReadonlyArray<Match<A, any>>>(
  value: A,
  ...matches: Matches
): Effect<EnvOf<typeof useMemo>, Option<MatchesReturn<Matches>>> {
  const eff = doEffect(function* () {
    const match = yield* useMemo(oneOf, [matches])
    const matched = yield* useMemo((m, v) => m(v), [match, value] as const)

    return matched as Option<MatchesReturn<Matches>>
  })

  return eff
}

export type MatchesReturn<Matches extends ReadonlyArray<Match<any, any>>> = {
  [K in keyof Matches]: Matches[K] extends Match<any, infer R> ? R : never
}[number]
