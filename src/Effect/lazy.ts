import { IO } from 'fp-ts/IO'

import { doEffect } from './doEffect'
import { Effect } from './Effect'

/**
 * Create an Effect<E, A> from an IO<Effect<E, A>>
 */
export const lazy = <E, A>(io: IO<Effect<E, A>>) => {
  return doEffect(function* () {
    return yield* io()
  })
}
