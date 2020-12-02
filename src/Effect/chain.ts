import { Arity1 } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'

import { doEffect } from './doEffect'
import { Effect } from './Effect'

/**
 * Sequence together 2 Effects.
 */
export const chain = curry(
  <A, E1, B, E2>(f: Arity1<A, Effect<E1, B>>, eff: Effect<E2, A>): Effect<E1 & E2, B> =>
    doEffect(function* () {
      return yield* f(yield* eff)
    }) as Effect<E1 & E2, B>,
) as {
  <A, E1, B, E2>(f: Arity1<A, Effect<E1, B>>, eff: Effect<E2, A>): Effect<E2 & E1, B>
  <A, E1, B>(f: Arity1<A, Effect<E1, B>>): <E2>(eff: Effect<E2, A>) => Effect<E2 & E1, B>
}
