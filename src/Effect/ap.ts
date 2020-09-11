import { Arity1 } from '@typed/fp/common/exports'
import { apResume } from '@typed/fp/Effect/apResume'
import { chain } from '@typed/fp/Effect/chain'
import { Effect } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { map } from '@typed/fp/Effect/map'
import { toEnv } from '@typed/fp/Effect/toEnv'
import { curry } from '@typed/fp/lambda/exports'

/**
 * @since 0.0.1
 */
export const ap = curry(
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B> => {
    const fnEnv = toEnv(fn)
    const valueEnv = toEnv(value)

    return fromEnv((e: E1 & E2) => apResume(fnEnv(e), valueEnv(e)))
  },
) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}

/**
 * @since 0.0.1
 */
export const apSeq = curry(
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B> =>
    chain((f) => map(f, value), fn),
) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}
