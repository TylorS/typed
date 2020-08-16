import { Arity1 } from '@typed/fp/common'
import { doEffect } from '@typed/fp/Effect/doEffect'
import { Effect } from '@typed/fp/Effect/Effect'
import { curry } from '@typed/fp/lambda'

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
