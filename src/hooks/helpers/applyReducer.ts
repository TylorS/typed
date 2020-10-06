import { doEffect, Pure } from '@typed/fp/Effect/exports'

import { setState, State } from '../core/State'

/**
 * Apply an reducer to a piece of state
 */
export const applyReducer = <A, B>(
  reducer: (acc: A, value: B) => A,
  state: State<A, A>,
): State<A, B> => {
  const getState = state[0]
  const dispatch = (b: B): Pure<A> =>
    doEffect(function* () {
      const a = yield* getState
      const updated = yield* setState(reducer(a, b), state)

      return updated
    })

  return [getState, dispatch]
}
