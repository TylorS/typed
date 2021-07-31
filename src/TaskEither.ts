/**
 * @typed/fp/TaskEither is an extension of fp-ts/TaskEither with additional
 * type-class instances.
 * @since 0.9.2
 */
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

import { swapEithers } from './internal'
import { MonadRec2 } from './MonadRec'
import * as T from './Task'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, E, B>(f: (value: A) => TE.TaskEither<E, E.Either<A, B>>) =>
  (value: A): TE.TaskEither<E, B> =>
    pipe(
      value,
      T.chainRec((a) => pipe(a, f, T.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<TE.URI> = { chainRec }

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<TE.URI> = { ...TE.Monad, chainRec }

export * from 'fp-ts/TaskEither'
