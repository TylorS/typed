import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { none, Option, some } from 'fp-ts/Option'

import { raf, RafEnv } from './raf'

export const rafLoop = <E, A>(
  f: (option: Option<A>) => Effect<E, A>,
): Effect<E & RafEnv, never> => {
  const eff = doEffect(function* () {
    let value: Option<A> = some(yield* f(none))

    while (true) {
      yield* raf

      value = some(yield* f(value))
    }
  })

  return eff
}
