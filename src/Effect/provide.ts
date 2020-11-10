import { And } from '@typed/fp/common/And'
import { curry } from '@typed/fp/lambda/exports'

import { Effect, fromEnv, Pure } from './Effect'
import { toEnv } from './toEnv'

export type Provider<Provided, Additional = unknown> = <E, A>(
  effect: Effect<E & Provided, A>,
) => Effect<E & Additional, A>

/**
 * Provide part of the environemnt, enforcing its usage.
 */
export const useSome = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e2, ...e1 })),
) as {
  <E1, A>(e1: E1, fx: Effect<E1, A>): Pure<A>
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A>
  <E1>(e1: E1): Provider<E1>
}

/**
 * Provide part of the environemnt, allowing for replacement later on.
 */
export const provideSome = curry(
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A> =>
    fromEnv((e2: E2) => toEnv(fx)({ ...e1, ...e2 })),
) as {
  <E1, A>(e1: E1, fx: Effect<E1, A>): Pure<A>
  <E1, E2, A>(e1: E1, fx: Effect<E1 & E2, A>): Effect<E2, A>
  <E1>(e1: E1): Provider<E1>
}

/**
 * Provide part of the environemnt, enforcing its usage.
 */
export const useAll = curry(<E, A>(e1: E, fx: Effect<E, A>) =>
  fromEnv((e2) => toEnv(fx)({ ...(e2 as object), ...e1 })),
) as {
  <E, A>(e1: E, fx: Effect<E, A>): Pure<A>
  <E>(e1: E): <A>(fx: Effect<E, A>) => Pure<A>
}

/**
 * Provide part of the environemnt, allowing for replacement later on.
 */
export const provideAll = curry(
  <E, A>(e: E, fx: Effect<E, A>): Pure<A> =>
    fromEnv((u: unknown) => toEnv(fx)({ ...e, ...(u as object) })),
) as {
  <E, A>(e: E, fx: Effect<E, A>): Pure<A>
  <E>(e: E): <A>(fx: Effect<E, A>) => Pure<A>
}

export type ProvidedEnvs<Providers extends ReadonlyArray<Provider<any, any>>> = And<
  {
    [K in keyof Providers]: Providers[K] extends Provider<infer R, any> ? R : unknown
  }
>

export type ProvidedAdditional<Providers extends ReadonlyArray<Provider<any, any>>> = And<
  {
    [K in keyof Providers]: Providers[K] extends Provider<any, infer R> ? R : unknown
  }
>

export const provideMany = <
  Providers extends readonly [Provider<any, any>, ...ReadonlyArray<Provider<any, any>>]
>(
  ...[first, ...rest]: Providers
): Provider<ProvidedEnvs<Providers>, ProvidedAdditional<Providers>> => <E, A>(
  effect: Effect<E & ProvidedEnvs<Providers>, A>,
) => rest.reduce((fx, provider) => provider(fx), first(effect))
