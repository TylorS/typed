import { MonadRec1 } from '@fp/MonadRec'
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as TO from 'fp-ts/TaskOption'

export const chainRec = <A, B>(f: (value: A) => TO.TaskOption<E.Either<A, B>>) => (
  value: A,
): TO.TaskOption<B> => pipe(value, f, TO.chain(E.match(chainRec(f), TO.of)))

export const ChainRec: ChainRec1<TO.URI> = { chainRec }
export const MonadRec: MonadRec1<TO.URI> = { ...TO.Monad, chainRec }

export * from 'fp-ts/TaskOption'
