import * as TE from 'fp-ts/TaskEither'
import * as T from './Task'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { swapEithers } from './internal'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { MonadRec2 } from './MonadRec'

export const chainRec = <A, E, B>(f: (value: A) => TE.TaskEither<E, E.Either<A, B>>) => (
  value: A,
): TE.TaskEither<E, B> =>
  pipe(
    value,
    T.chainRec((a) => pipe(a, f, T.map(swapEithers))),
  )

export const ChainRec: ChainRec2<TE.URI> = { chainRec }
export const MonadRec: MonadRec2<TE.URI> = { ...TE.Monad, chainRec }

export * from 'fp-ts/TaskEither'
