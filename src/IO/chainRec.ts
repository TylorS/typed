import { Arity1 } from '@fp/lambda'
import { MonadRec1, tailRec } from '@fp/MonadRec'
import { Either } from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'
import { IO, Monad, URI as IoUri } from 'fp-ts/dist/IO'

export const chainRec = <A, B>(f: Arity1<A, IO<Either<A, B>>>) => (value: A): IO<B> => () =>
  pipe(
    value,
    tailRec((a: A) => f(a)()),
  )

export const MonadRec: MonadRec1<IoUri> = {
  ...Monad,
  chainRec,
}
