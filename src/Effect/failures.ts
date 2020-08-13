import { HeadArg } from '@typed/fp/common'
import { curry } from '@typed/fp/lambda'
import { Either, left, right } from 'fp-ts/es6/Either'
import { O } from 'ts-toolbelt'
import { async, Effect, Resume } from './Effect'
import { fromEnv } from './fromEnv'
import { map } from './map'
import { ProvidedEffect } from './provide'
import { runResume } from './runResume'
import { toEnv } from './toEnv'

export type FailEnv<K extends PropertyKey, Err> = {
  readonly [key in K]: (err: Err) => Resume<never>
}

export const fail = curry(
  <K extends PropertyKey, Err>(key: K, error: Err): Effect<FailEnv<K, Err>, never> =>
    fromEnv((e) => e[key](error)),
) as {
  <K extends PropertyKey, Err>(key: K, error: Err): Effect<FailEnv<K, Err>, never>
  <K extends PropertyKey>(key: K): <Err>(error: Err) => Effect<FailEnv<K, Err>, never>
}

export const catchError = curry(
  <K extends PropertyKey, Err, E, A>(
    key: K,
    onError: (error: Err) => A,
    effect: Effect<E & FailEnv<K, Err>, A>,
  ): CatchError<K, Err, E, A> =>
    fromEnv((e: E) =>
      async((returnToOuterContext) => {
        // FailEnv implementation which uses continuations to bail out to the outer context
        const failEnv = {
          [key]: (err: Err) => async(() => returnToOuterContext(onError(err))),
        } as FailEnv<K, Err>

        const env = toEnv(effect)

        return runResume(env({ ...e, ...failEnv }), returnToOuterContext)
      }),
    ) as CatchError<K, Err, E, A>,
) as {
  <K extends PropertyKey, Err, A, E>(
    key: K,
    onError: (error: Err) => A,
    effect: Effect<E & FailEnv<K, Err>, A>,
  ): CatchError<K, Err, E, A>

  <K extends PropertyKey, Err, A>(key: K, onError: (error: Err) => A): <E>(
    effect: Effect<E & FailEnv<K, Err>, A>,
  ) => CatchError<K, Err, E, A>

  <K extends PropertyKey>(key: K): {
    <Err, A, E>(onError: (error: Err) => A, effect: Effect<E & FailEnv<K, Err>, A>): CatchError<
      K,
      Err,
      E,
      A
    >
    <Err, A>(onError: (error: Err) => A): <E>(
      effect: Effect<E & FailEnv<K, Err>, A>,
    ) => CatchError<K, Err, E, A>
  }
}

type CatchError<K extends PropertyKey, Err, E, A> = K extends keyof E
  ? {
      // K should be eliminated by E already, if correct
      error: 'Provided an invalid error handler'
      parameters: {
        key: K
        attempted: Err
        expected: HeadArg<E[K]>
      }
    }
  : ProvidedEffect<FailEnv<K, Err>, E, A>

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
