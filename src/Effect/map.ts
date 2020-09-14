import { Arity1 } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'

import { doEffect } from './doEffect'
import { Effect } from './Effect'

/**
 * @since 0.0.1
 */
export const map = curry(
  <A, B, E>(f: Arity1<A, B>, eff: Effect<E, A>): Effect<E, B> =>
    doEffect(function* () {
      return f(yield* eff)
    }),
) as {
  <A, B, E>(f: Arity1<A, B>, eff: Effect<E, A>): Effect<E, B>
  <A, B>(f: Arity1<A, B>): <E>(eff: Effect<E, A>) => Effect<E, B>
}
