import { setState, State } from '../core/exports'

/**
 * Apply an reducer to a piece of state
 */
export const applyReducer = <A, B>(
  reducer: (acc: A, value: B) => A,
  state: State<A, A>,
): State<A, B> => {
  const getState = state[0]
  const dispatch = (b: B): A => setState(reducer(getState(), b), state)

  return [getState, dispatch]
}
