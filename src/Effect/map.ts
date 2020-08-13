import { Arity1 } from '@typed/fp/common'
import { curry } from '@typed/fp/lambda'
import { doEffect } from './doEffect'
import { Effect } from './Effect'

export const map = curry(
  <A, B, E>(f: Arity1<A, B>, eff: Effect<E, A>): Effect<E, B> =>
    doEffect(function* () {
      return f(yield* eff)
    }),
) as {
  <A, B, E>(f: Arity1<A, B>, eff: Effect<E, A>): Effect<E, B>
  <A, B>(f: Arity1<A, B>): <E>(eff: Effect<E, A>) => Effect<E, B>
}
