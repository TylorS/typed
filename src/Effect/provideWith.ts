import { pipe } from 'fp-ts/lib/function'

import { doEffect } from './doEffect'
import { Effect } from './Effect'
import { provide } from './provide'

export function provideWith<E1, E2>(provider: Effect<E1, E2>) {
  const providedEnvs = new WeakMap<Effect<any, any>, any>()

  return <E3, A>(effect: Effect<E2 & E3, A>): Effect<E1 & E3, A> =>
    doEffect(function* () {
      const provided = providedEnvs.has(effect)
        ? providedEnvs.get(effect)!
        : providedEnvs.set(effect, yield* provider).get(effect)!
      const value = yield* pipe(effect, provide(provided)) as Effect<E3, A>

      return value
    })
}
