import { Disposable } from '@most/types'
import { Either, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Env, map, of } from './Env'
import { async, Resume, start } from './Resume'

export type Fail<Key extends PropertyKey, E> = Readonly<Record<Key, (e: E) => Resume<never>>>

export const throwError =
  <Key extends PropertyKey>(key: Key) =>
  <E>(err: E): Env<Fail<Key, E>, never> =>
  (e) =>
    e[key](err)

const createKv = <K extends PropertyKey, V>(k: K, v: V): Readonly<Record<K, V>> =>
  ({ [k]: v } as Readonly<Record<K, V>>)

const createFail = <Key extends PropertyKey, E>(
  key: Key,
  resume: (e: E) => Disposable,
): Fail<Key, E> => createKv(key, (e: E) => async<never>(() => resume(e)))

export const catchErrorW =
  <Key extends PropertyKey>(key: Key) =>
  <E, R1, A>(onError: (err: E) => Env<R1, A>) =>
  <R2, B>(env: Env<Fail<Key, E>, B> | Env<R2 & Fail<Key, E>, B>): Env<R1 & R2, A | B> =>
  (r) =>
    async((resume) =>
      pipe(
        { ...r, ...createFail(key, (e: E) => pipe(r, onError(e), start(resume))) },
        env,
        start(resume),
      ),
    )

export const catchError = catchErrorW as <Key extends PropertyKey>(
  key: Key,
) => {
  <E, R1, A>(onError: (err: E) => Env<R1, A>): {
    <R2>(env: Env<R2 & Fail<Key, E>, A>): Env<R1 & R2, A>
    (env: Env<Fail<Key, E>, A>): Env<R1, A>
  }
}

export const attempt =
  <Key extends PropertyKey>(key: Key) =>
  <R, E, B>(env: Env<R & Fail<Key, E>, B>): Env<R, Either<E, B>> =>
    pipe(
      env,
      map(right),
      catchErrorW(key)((e: E) => of(left(e))),
    )
