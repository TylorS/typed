/**
 * @typed/fp/Task is an extension of fp-ts/Task with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as T from 'fp-ts/Task'

import { MonadRec1 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, B>(f: (a: A) => T.Task<E.Either<A, B>>) =>
  (value: A): T.Task<B> =>
    pipe(value, f, T.chain(E.match(chainRec(f), T.of)))

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec1<T.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec1<T.URI> = {
  ...T.Monad,
  chainRec,
}

export * from 'fp-ts/Task'
