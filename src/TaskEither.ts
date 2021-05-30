import { swapEithers } from '@fp/internal'
import { MonadRec2 } from '@fp/MonadRec'
import * as T from '@fp/Task'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

export const chainRec =
  <A, E, B>(f: (value: A) => TE.TaskEither<E, E.Either<A, B>>) =>
  (value: A): TE.TaskEither<E, B> =>
    pipe(
      value,
      T.chainRec((a) => pipe(a, f, T.map(swapEithers))),
    )

export const ChainRec: ChainRec2<TE.URI> = { chainRec }
export const MonadRec: MonadRec2<TE.URI> = { ...TE.Monad, chainRec }

export * from 'fp-ts/TaskEither'
