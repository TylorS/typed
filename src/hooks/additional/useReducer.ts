import { deepEqualsEq } from '@typed/fp/common/exports'
import { Arity2 } from '@typed/fp/common/types'
import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { useMemo, useState } from '../core/exports'
import { applyReducer } from '../helpers/applyReducer'

export const useReducer = <E, A, B>(
  initial: Effect<E, A>,
  reducer: Arity2<A, B, A>,
  eq: Eq<A> = deepEqualsEq,
) => {
  const eff = doEffect(function* () {
    const state = yield* useState(initial, eq)

    return yield* useMemo(applyReducer, [reducer, state])
  })

  return eff
}
