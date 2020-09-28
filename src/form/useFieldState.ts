import { deepEqualsEq } from '@typed/fp/common/exports'
import { chain, doEffect, Effect } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useState } from '@typed/fp/hooks/exports'
import { Eq } from 'fp-ts/Eq'

import { getCurrentState } from './CurrentState'
import { FieldState } from './FieldState'
import { useFieldData } from './useFieldData'

export function useFieldState<K extends PropertyKey, E, A>(
  key: K,
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & HookOpEnvs, FieldState<K, A>> {
  const eff = doEffect(function* () {
    const state = yield* chain(getCurrentState, useState(initial, eq))

    return yield* useFieldData(key, state, eq)
  })

  return eff
}
