import { pipe } from 'fp-ts/function'

import { doEffect } from './doEffect'
import { Effect } from './Effect'
import { provideSome, useSome } from './provide'

/**
 * Use an Effect to compute part of the environment for another Effect using provideSome.
 */
export function provideWith<E1, E2>(provider: Effect<E1, E2>) {
  return <E3, A>(effect: Effect<E2 & E3, A>): Effect<E1 & E3, A> =>
    doEffect(function* () {
      return yield* pipe(effect, provideSome(yield* provider))
    })
}

/**
 * Use an Effect to computer part of the environment for another Effect using useSome.
 */
export function useWith<E1, E2>(provider: Effect<E1, E2>) {
  return <E3, A>(effect: Effect<E2 & E3, A>): Effect<E1 & E3, A> =>
    doEffect(function* () {
      return yield* pipe(effect, useSome(yield* provider))
    })
}
