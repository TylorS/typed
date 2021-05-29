import { pipe } from '@fp/function'
import { swapEithers } from '@fp/internal'
import { MonadRec2 } from '@fp/MonadRec'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import * as IO from 'fp-ts/IO'
import * as IOE from 'fp-ts/IOEither'

export const chainRec = <A, E, B>(f: (value: A) => IOE.IOEither<E, Either<A, B>>) => (
  value: A,
): IOE.IOEither<E, B> =>
  pipe(
    value,
    IO.chainRec((a) => pipe(a, f, IO.map(swapEithers))),
  )

export const ChainRec: ChainRec2<IOE.URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<IOE.URI> = {
  ...IOE.Monad,
  ...ChainRec,
}

export * from 'fp-ts/IOEither'
