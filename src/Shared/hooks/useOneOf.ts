import { doEffect, Effect } from '@fp/Effect/exports'
import { Match, oneOf } from '@fp/logic/exports'
import { isSome } from 'fp-ts/Option'

import { Shared, SharedEnv, SharedKey } from '../core/exports'
import { getSharedState } from '../State/exports'
import { useMemo } from './useMemo'

/**
 * Keep track of the current match value.
 */
export const useOneOf = <E, O, I, A extends ReadonlyArray<Match<I, O>>>(
  shared: Shared<SharedKey, E, O>,
  input: I,
  ...matches: A
): Effect<SharedEnv & E, O> => {
  const eff = doEffect(function* () {
    const [getOutput, setOutput] = yield* getSharedState(shared)
    const match = yield* useMemo(() => oneOf(matches), [matches])
    const matched = yield* useMemo(() => match(input), [input, match] as const)

    if (isSome(matched) && !shared.eq.equals(matched.value, getOutput())) {
      setOutput(matched.value)
    }

    return getOutput()
  })

  return eff
}
