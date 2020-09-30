import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { HookOpEnvs } from '@typed/fp/hooks/exports'
import { Eq } from 'fp-ts/Eq'

import { useCurrentState } from './CurrentState'
import { FieldState } from './FieldState'
import { useFieldData } from './useFieldData'

/**
 * Create a given piece of Field State.
 */
export function useFieldState<K extends PropertyKey, E, A>(
  key: K,
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & HookOpEnvs, FieldState<K, A>> {
  const eff = doEffect(function* () {
    const state = yield* useCurrentState(initial, eq)

    return yield* useFieldData(key, state, eq)
  })

  return eff
}
