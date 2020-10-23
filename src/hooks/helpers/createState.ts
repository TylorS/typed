import { doEffect, Effect, execPure, Pure } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { State } from '../core/exports'

/**
 * Create a piece of state that uses an initial value,
 * avoids updates by applying the provided Eq instance,
 * performing an effect with the current and updated values when
 * it is updated.
 */
export function createState<A, B>(
  initial: Effect<A, B>,
  eq: Eq<B>,
  onUpdated: (current: B, updated: B) => Pure<void>,
): Effect<A, State<B, B>> {
  const eff = doEffect(function* () {
    let current = yield* initial
    const getState = () => current
    const updateState = (b: B) => {
      const a = current

      if (eq.equals(a, b)) {
        return current
      }

      current = b

      execPure(onUpdated(a, b))

      return b
    }

    const state: State<B, B> = [getState, updateState]

    return state
  })

  return eff
}
