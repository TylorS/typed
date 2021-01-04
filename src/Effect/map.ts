import { Arity1 } from '@fp/common/exports'
import { curry } from '@fp/lambda/exports'

import { doEffect } from './doEffect'
import { Effect } from './Effect'

/**
 * Apply a function to the return value of an Effect.
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
