/**
 * Fail is an Env-based abstraction for a try/catch style API
 * which is based on continuations to provide type-safe errors
 * with distinct channels to help separate errors that originate from different places.
 * @since 0.9.2
 */
import { Disposable } from '@most/types'
import { Either, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { undisposable } from './Disposable'
import { Env, map, of } from './Env'
import { async, Resume, run } from './Resume'
import { make } from './struct'

/**
 * @since 0.9.2
 * @category Model
 */
export type Fail<Key extends PropertyKey, E> = {
  readonly [_ in Key]: (e: E) => Resume<never>
}
/**
 * @since 0.9.2
 * @category Constructor
 */
export const throwError =
  <Key extends PropertyKey>(key: Key) =>
  <E>(err: E): Env<Fail<Key, E>, never> =>
  (e) =>
    e[key](err)

const createFailEnv = <Key extends PropertyKey, E>(
  key: Key,
  resume: (e: E) => Disposable,
): Fail<Key, E> => make(key, (e: E) => async<never>(() => resume(e)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const catchErrorW =
  <Key extends PropertyKey>(key: Key) =>
  <E, R1, A>(onError: (err: E) => Env<R1, A>) =>
  <R2, B>(env: Env<Fail<Key, E>, B> | Env<R2 & Fail<Key, E>, B>): Env<R1 & R2, A | B> =>
  (r) =>
    async((resume) =>
      pipe(
        { ...r, ...createFailEnv(key, (e: E) => pipe(r, onError(e), run(resume))) },
        env,
        run(resume),
      ),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const catchError = catchErrorW as <Key extends PropertyKey>(
  key: Key,
) => {
  <E, R1, A>(onError: (err: E) => Env<R1, A>): {
    <R2>(env: Env<Fail<Key, E>, A> | Env<R2 & Fail<Key, E>, A>): Env<R1 & R2, A>
    (env: Env<Fail<Key, E>, A>): Env<R1, A>
  }
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const attempt =
  <Key extends PropertyKey>(key: Key) =>
  <R, E, B>(env: Env<Fail<Key, E>, B> | Env<R & Fail<Key, E>, B>): Env<R, Either<E, B>> =>
    pipe(
      env,
      map(right),
      catchErrorW(key)((e: E) => of(left(e))),
    )

/**
 * Creates a Provider for an Error which will throw an Exception.
 * Reserve this only for *critical* application errors
 * @since 0.13.4
 * @category Environment
 */
export const criticalExpection =
  <K extends PropertyKey>(key: K) =>
  <E>(f: (error: E) => string): Fail<K, E> =>
    createFailEnv(
      key,
      undisposable((e: E) => {
        throw new Error(f(e))
      }),
    )

/**
 * @since 0.9.2
 * @category Model
 */
export interface Failure<K extends PropertyKey, E> {
  readonly throw: (err: E) => Env<Fail<K, E>, never>

  readonly catchW: <R1, A>(
    onError: (err: E) => Env<R1, A>,
  ) => <R2, B>(env: Env<Fail<K, E>, B> | Env<R2 & Fail<K, E>, B>) => Env<R1 & R2, A | B>

  readonly catch: <R1, A>(
    onError: (err: E) => Env<R1, A>,
  ) => {
    <R2>(env: Env<Fail<K, E>, A> | Env<R2 & Fail<K, E>, A>): Env<R1 & R2, A>
    (env: Env<Fail<K, E>, A>): Env<R1, A>
  }

  readonly attempt: <R, B>(env: Env<Fail<K, E>, B> | Env<R & Fail<K, E>, B>) => Env<R, Either<E, B>>

  readonly criticalExpection: (f: (error: E) => string) => Fail<K, E>
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const named =
  <E>() =>
  <K extends PropertyKey>(name: K): Failure<K, E> => {
    return {
      throw: throwError(name),
      catchW: catchErrorW(name),
      catch: catchError(name),
      attempt: attempt(name) as Failure<K, E>['attempt'],
      criticalExpection: criticalExpection(name),
    }
  }

/**
 * @since 0.13.4
 * @category Type-level
 */
export type ErrorOf<A> = [A] extends [Failure<infer _, infer E>]
  ? E
  : [A] extends [Fail<infer _, infer E>]
  ? E
  : never

/**
 * @since 0.13.4
 * @category Type-level
 */
export type KeyOf<A> = [A] extends [Failure<infer K, infer _>]
  ? K
  : [A] extends [Fail<infer K, infer _>]
  ? K
  : never

/**
 * @since 0.13.4
 * @category Type-level
 */
export type EnvOf<A> = [A] extends [Failure<infer K, infer E>]
  ? Fail<K, E>
  : [A] extends [Fail<infer K, infer E>]
  ? Fail<K, E>
  : never
