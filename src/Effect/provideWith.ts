import { pipe } from 'fp-ts/lib/function'

import { doEffect } from './doEffect'
import { Effect } from './Effect'
import { memo } from './memo'
import { provide } from './provide'

export function provideWith<E1, E2>(provider: Effect<E1, E2>) {
  const providerEff = memo(provider)

  return <E3, A>(effect: Effect<E2 & E3, A>): Effect<E1 & E3, A> =>
    doEffect(function* () {
      const provided = yield* providerEff
      const value = yield* pipe(effect, provide(provided)) as Effect<E3, A>

      return value
    })
}
