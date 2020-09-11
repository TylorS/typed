import { Equals, IsUnknown } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { toEnv } from '@typed/fp/Effect/toEnv'
import { curry } from '@typed/fp/lambda/exports'
import { A, O } from 'ts-toolbelt'

/**
 * @since 0.0.1
 */
export type ProvidedEffect<Provided extends {}, E extends {}, A> = Equals<Provided, {}> extends true
  ? Effect<E, A>
  : AllIsProvided<Provided, E> extends true
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
 * Provide part of the environemnt, enforcing its usage.
 * @since 0.0.1
 */
export const use = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): ProvidedEffect<E1, E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e2, ...e1 })) as ProvidedEffect<E1, E2, A>,
) as {
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): ProvidedEffect<E1, E2, A>
  <E1>(e1: E1): <E2, A>(fx: Effect<E1 & E2, A>) => ProvidedEffect<E1, E2, A>
}

/**
 * Provide part of the environemnt, allowing for replacement later on.
 * @since 0.0.1
 */
export const provide = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): ProvidedEffect<E1, E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e1, ...e2 })) as ProvidedEffect<E1, E2, A>,
) as {
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): ProvidedEffect<E1, E2, A>
  <E1>(e1: E1): <E2, A>(fx: Effect<E1 & E2, A>) => ProvidedEffect<E1, E2, A>
}
