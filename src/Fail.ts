import { Env, map, of } from '@fp/Env'
import { async, Resume, run } from '@fp/Resume'
import { Disposable } from '@most/types'
import { Either, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { make } from './struct'

export type Fail<Key extends PropertyKey, E> = Readonly<Record<Key, (e: E) => Resume<never>>>

export const throwError =
  <Key extends PropertyKey>(key: Key) =>
  <E>(err: E): Env<Fail<Key, E>, never> =>
  (e) =>
    e[key](err)

const createFailEnv = <Key extends PropertyKey, E>(
  key: Key,
  resume: (e: E) => Disposable,
): Fail<Key, E> => make(key, (e: E) => async<never>(() => resume(e)))

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

export const catchError = catchErrorW as <Key extends PropertyKey>(
  key: Key,
) => {
  <E, R1, A>(onError: (err: E) => Env<R1, A>): {
    <R2>(env: Env<Fail<Key, E>, A> | Env<R2 & Fail<Key, E>, A>): Env<R1 & R2, A>
    (env: Env<Fail<Key, E>, A>): Env<R1, A>
  }
}

export const attempt =
  <Key extends PropertyKey>(key: Key) =>
  <R, E, B>(env: Env<Fail<Key, E>, B> | Env<R & Fail<Key, E>, B>): Env<R, Either<E, B>> =>
    pipe(
      env,
      map(right),
      catchErrorW(key)((e: E) => of(left(e))),
    )

export interface Failure<K extends string, E> {
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
}

export const createFailure =
  <E>() =>
  <K extends string>(name: K): Failure<K, E> => {
    return {
      throw: throwError(name),
      catchW: catchErrorW(name),
      catch: catchError(name),
      attempt: attempt(name) as Failure<K, E>['attempt'],
    }
  }
