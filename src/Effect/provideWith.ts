import { pipe } from 'fp-ts/function'

import { doEffect } from './doEffect'
import { Effect } from './Effect'
import { provideSome, useSome } from './provide'

export function provideWith<E1, E2>(provider: Effect<E1, E2>) {
  return <E3, A>(effect: Effect<E2 & E3, A>): Effect<E1 & E3, A> =>
    doEffect(function* () {
      return yield* pipe(effect, provideSome(yield* provider))
    })
}

export function useWith<E1, E2>(provider: Effect<E1, E2>) {
  return <E3, A>(effect: Effect<E2 & E3, A>): Effect<E1 & E3, A> =>
    doEffect(function* () {
      return yield* pipe(effect, useSome(yield* provider))
    })
}
