import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useState } from '@typed/fp/hooks/exports'
import { Eq } from 'fp-ts/Eq'

import { FieldState } from './FieldState'
import { useFieldData } from './useFieldData'

export function useFieldState<K, E, A>(
  key: K,
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & HookOpEnvs, FieldState<K, A>> {
  const eff = doEffect(function* () {
    const state = yield* useState(initial, eq)

    return yield* useFieldData(key, state, eq)
  })

  return eff
}
