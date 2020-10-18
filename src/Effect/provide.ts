import { curry } from '@typed/fp/lambda/exports'

import { Effect, Pure } from './Effect'
import { fromEnv } from './fromEnv'
import { toEnv } from './toEnv'

/**
 * Provide part of the environemnt, enforcing its usage.
 */
export const useSome = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e2, ...e1 })),
) as {
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A>
  <E1>(e1: E1): <E2, A>(fx: Effect<E1 & E2, A>) => Effect<E2, A>
}

/**
 * Provide part of the environemnt, allowing for replacement later on.
 */
export const provideSome = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e1, ...e2 })),
) as {
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A>
  <E1>(e1: E1): <E2, A>(fx: Effect<E1 & E2, A>) => Effect<E2, A>
}

/**
 * Provide part of the environemnt, enforcing its usage.
 */
export const useAll = curry(<E, A>(e1: E, fx: Effect<E, A>) => fromEnv(() => toEnv(fx)(e1))) as {
  <E, A>(e1: E, fx: Effect<E, A>): Pure<A>
  <E>(e1: E): <A>(fx: Effect<E, A>) => Pure<A>
}

/**
 * Provide part of the environemnt, allowing for replacement later on.
 */
export const provideAll = curry(
  <E, A>(e: E, fx: Effect<E, A>): Pure<A> => fromEnv(() => toEnv(fx)(e)),
) as {
  <E, A>(e: E, fx: Effect<E, A>): Pure<A>
  <E>(e: E): <A>(fx: Effect<E, A>) => Pure<A>
}
