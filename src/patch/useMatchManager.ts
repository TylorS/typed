import { And, Arity1 } from '@typed/fp/common/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { useEffectBy, useMatches } from '@typed/fp/hooks/additional/exports'
import { HookEnv, HookPositions, HookSymbols, useMemo } from '@typed/fp/hooks/core/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Match } from '@typed/fp/logic/exports'
import { Ref, SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { identity } from 'fp-ts/function'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { useKeyManager } from './useKeyManager'

/**
 * Allows sequencing a series of possible matches to a some value.
 */
export function useMatchManager<
  A,
  B,
  Matches extends ReadonlyArray<Match<A, Arity1<Ref<B | null | undefined>, Effect<any, any>>>>
>(
  value: A,
  ...matches: Matches
): Effect<
  HookEnv & SharedRefEnv<HookPositions> & SharedRefEnv<HookSymbols> & EnvOfMatchesReturn<Matches>,
  Option<ReturnOfMatchesReturn<Matches>>
> {
  const eff = doEffect(function* () {
    const modifiedMatches = yield* useMemo(
      (ms) => ms.map((m) => Match.map((c) => [m, c] as const, m)),
      [matches],
    )

    const match = yield* useMatches(value, ...modifiedMatches)

    const [c] = yield* useEffectBy([match], identity, (option) =>
      doEffect(function* () {
        return isNone(option) ? none : some(yield* useKeyManager(...option.value))
      }),
    )

    return c
  })

  return eff
}

export type EnvOfMatchesReturn<
  Matches extends ReadonlyArray<Match<any, Fn<any, Effect<any, any>>>>
> = And<
  {
    [K in keyof Matches]: Matches[K] extends Match<any, Fn<any, Effect<infer R, any>>> ? R : never
  }
>

export type ReturnOfMatchesReturn<
  Matches extends ReadonlyArray<Match<any, Fn<any, Effect<any, any>>>>
> = {
  [K in keyof Matches]: Matches[K] extends Match<any, Fn<any, Effect<any, infer R>>> ? R : never
}[number]
