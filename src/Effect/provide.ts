import { Equals, IsUnknown } from '@typed/fp/common'
import { curry } from '@typed/fp/lambda'
import { A, O } from 'ts-toolbelt'
import { Effect, Pure } from './Effect'
import { fromEnv } from './fromEnv'
import { toEnv } from './toEnv'

export type ProvidedEffect<Provided extends {}, E extends {}, A> = AllIsProvided<
  Provided,
  E
> extends true
  ? Pure<A>
  : A.Extends<E, Provided> extends 1
  ? Effect<O.Exclude<E, Provided>, A>
  : Effect<E, A>

type AllIsProvided<E1, E2> = Equals<E1, E2> extends true
  ? true
  : IsUnknown<E1> extends false
  ? IsUnknown<E2>
  : false

/**
 * Provide part of the environemnt
 */
export const provide = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): ProvidedEffect<E1, E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e1, ...e2 })) as ProvidedEffect<E1, E2, A>,
) as {
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): ProvidedEffect<E1, E2, A>
  <E1>(e1: E1): <E2, A>(fx: Effect<E1 & E2, A>) => ProvidedEffect<E1, E2, A>
}
