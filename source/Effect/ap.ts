import { Arity1 } from '@typed/fp/common'
import { curry } from '@typed/fp/lambda'
import { apResume } from './apResume'
import { chain } from './chain'
import { Effect } from './Effect'
import { fromEnv } from './fromEnv'
import { map } from './map'
import { toEnv } from './toEnv'

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

export const apSeq = curry(
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B> =>
    chain((f) => map(f, value), fn),
) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}
