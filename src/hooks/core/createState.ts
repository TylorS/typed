import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { State } from './State'

export function createState<A, B>(
  initial: Effect<A, B>,
  eq: Eq<B>,
  onUpdated: (current: B, updated: B) => Pure<void>,
): Effect<A, State<B, B>> {
  const eff = doEffect(function* () {
    let current = yield* initial
    const getState = Pure.fromIO(() => current)
    const updateState = (b: B) =>
      doEffect(function* () {
        if (eq.equals(current, b)) {
          return current
        }

        current = b

        yield* onUpdated(current, b)

        return b
      })
    const state: State<B, B> = [getState, updateState]

    return state
  })

  return eff
}
