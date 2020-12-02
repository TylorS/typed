import { HeadArg } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'
import { async, Resume, run } from '@typed/fp/Resume/exports'
import { Either, left, right } from 'fp-ts/Either'
import { O } from 'ts-toolbelt'

import { Effect, fromEnv } from './Effect'
import { map } from './map'
import { toEnv } from './toEnv'

/**
 * An environment to represent type-safe errors.
 */
export type FailEnv<K extends PropertyKey, Err> = {
  readonly [key in K]: (err: Err) => Resume<never>
}

/**
 * Place the requirement to satisfy a potential failure from the environment at the provided key.
 */
export const fail = curry(
  <K extends PropertyKey, Err>(key: K, error: Err): Effect<FailEnv<K, Err>, never> =>
    fromEnv((e) => e[key](error)),
) as {
  <K extends PropertyKey, Err>(key: K, error: Err): Effect<FailEnv<K, Err>, never>
  <K extends PropertyKey>(key: K): <Err>(error: Err) => Effect<FailEnv<K, Err>, never>
}

/**
 * Catch a keyed error using continuations.
 */
export const catchError = curry(
  <K extends PropertyKey, Err, E, A>(
    key: K,
    onError: (error: Err) => A,
    effect: Effect<E & FailEnv<K, Err>, A>,
  ): Effect<E, A> =>
    fromEnv((e: E) =>
      async((returnToOuterContext) => {
        // FailEnv implementation which uses continuations to bail out to the outer context
        const failEnv = {
          [key]: (err: Err) => async(() => returnToOuterContext(onError(err))),
        } as FailEnv<K, Err>

        const env = toEnv(effect)

        return run(env({ ...e, ...failEnv }), returnToOuterContext)
      }),
    ) as Effect<E, A>,
) as {
  <K extends PropertyKey, Err, A, E>(
    key: K,
    onError: (error: Err) => A,
    effect: Effect<E & FailEnv<K, Err>, A>,
  ): Effect<E, A>

  <K extends PropertyKey, Err, A>(key: K, onError: (error: Err) => A): <E>(
    effect: Effect<E & FailEnv<K, Err>, A>,
  ) => Effect<E, A>

  <K extends PropertyKey>(key: K): {
    <Err, A, E>(onError: (error: Err) => A, effect: Effect<E & FailEnv<K, Err>, A>): Effect<E, A>
    <Err, A>(onError: (error: Err) => A): <E>(
      effect: Effect<E & FailEnv<K, Err>, A>,
    ) => Effect<E, A>
  }
}

/**
 * Attempt an Effect that can fail catching the error into an Either.
 */
export const attempt = curry(
  <K extends PropertyKey, E extends FailEnv<K, never>, A>(
    key: K,
    eff: Effect<E, A>,
  ): Effect<O.Exclude<E, FailEnv<K, any>>, Either<HeadArg<E[K]>, A>> =>
    catchError(key, left, map(right, eff)) as any,
) as {
  <K extends PropertyKey, E extends FailEnv<K, never>, A>(key: K, eff: Effect<E, A>): Effect<
    O.Exclude<E, FailEnv<K, any>>,
    Either<HeadArg<E[K]>, A>
  >

  <K extends PropertyKey>(key: K): <E extends FailEnv<K, never>, A>(
    eff: Effect<E, A>,
  ) => Effect<O.Exclude<E, FailEnv<K, any>>, Either<HeadArg<E[K]>, A>>
}
