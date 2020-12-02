import { doEffect } from './doEffect'
import { Effect } from './Effect'

/**
 * Run an Effect over and over within a while-loop.
 */
export const forever = <E, A>(
  effect: Effect<E, A>,
  onValue?: (value: A) => void,
): Effect<E, never> => {
  if (onValue) {
    return doEffect(function* () {
      while (true) {
        const a = yield* effect

        onValue(a)
      }
    })
  }

  return doEffect(function* () {
    while (true) {
      yield* effect
    }
  })
}
