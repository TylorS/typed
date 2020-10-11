import { doEffect } from './doEffect'
import { Effect } from './Effect'

export const forever = <E, A>(
  effect: Effect<E, A>,
  onValue?: (value: A) => void,
): Effect<E, never> => {
  const eff = doEffect(function* () {
    while (true) {
      const a = yield* effect

      onValue?.(a)
    }
  })

  return eff
}
