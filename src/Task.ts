import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { MonadRec1 } from './MonadRec'

export const chainRec = <A, B>(f: (a: A) => T.Task<E.Either<A, B>>) => (value: A): T.Task<B> =>
  pipe(value, f, T.chain(E.match(chainRec(f), T.of)))

export const ChainRec: ChainRec1<T.URI> = {
  chainRec,
}

export const MonadRec: MonadRec1<T.URI> = {
  ...T.Monad,
  chainRec,
}

export * from 'fp-ts/Task'
