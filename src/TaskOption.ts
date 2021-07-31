/**
 * @typed/fp/TaskOption is an extension of fp-ts/TaskOption with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as TO from 'fp-ts/TaskOption'

import { MonadRec1 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, B>(f: (value: A) => TO.TaskOption<E.Either<A, B>>) =>
  (value: A): TO.TaskOption<B> =>
    pipe(value, f, TO.chain(E.match(chainRec(f), TO.of)))

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec1<TO.URI> = { chainRec }
/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec1<TO.URI> = { ...TO.Monad, chainRec }

export * from 'fp-ts/TaskOption'
