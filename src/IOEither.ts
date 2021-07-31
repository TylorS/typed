/**
 * @typed/fp/IOEither is an extension to fp-ts/IOEither with
 * ChainRec + MonadRec instances for stack-safety.
 * @since 0.9.2
 */
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import * as IO from 'fp-ts/IO'
import * as IOE from 'fp-ts/IOEither'

import { pipe } from './function'
import { swapEithers } from './internal'
import { MonadRec2 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, E, B>(f: (value: A) => IOE.IOEither<E, Either<A, B>>) =>
  (value: A): IOE.IOEither<E, B> =>
    pipe(
      value,
      IO.chainRec((a) => pipe(a, f, IO.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<IOE.URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<IOE.URI> = {
  ...IOE.Monad,
  ...ChainRec,
}

export * from 'fp-ts/IOEither'
