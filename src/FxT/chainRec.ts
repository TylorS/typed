import { Arity1 } from '@typed/fp/lambda'
import { MonadRec, MonadRec1, MonadRec2, MonadRec3 } from '@typed/fp/MonadRec'
import { Either, match } from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'
import { URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { FxT, FxT1, FxT2, FxT3 } from './FxT'
import { liftFx } from './liftFx'
import { toMonad } from './toMonad'

export function chainRec<F extends URIS>(M: MonadRec1<F>): ChainRecFxT1<F>

export function chainRec<F extends URIS2>(M: MonadRec2<F>): ChainRecFxT2<F>

export function chainRec<F extends URIS3>(M: MonadRec3<F>): ChainRecFxT3<F>

export function chainRec<F>(M: MonadRec<F>): ChainRecFxT<F> {
  return chainRec_(M) as ChainRecFxT<F>
}

export type ChainRecFxT<F> = F extends URIS
  ? ChainRecFxT1<F>
  : F extends URIS2
  ? ChainRecFxT2<F>
  : F extends URIS3
  ? ChainRecFxT3<F>
  : <A, B>(f: Arity1<A, FxT<F, Either<A, B>>>) => (a: A) => FxT<F, B>

export type ChainRecFxT1<F extends URIS> = <A, B>(
  f: Arity1<A, FxT1<F, Either<A, B>>>,
) => (a: A) => FxT1<F, B>

export type ChainRecFxT2<F extends URIS2> = <A, E1, B>(
  f: Arity1<A, FxT2<F, E1, Either<A, B>>>,
) => (a: A) => FxT2<F, E1, B>

export type ChainRecFxT3<F extends URIS3> = <A, R1, E1, B>(
  f: Arity1<A, FxT3<F, R1, E1, Either<A, B>>>,
) => (a: A) => FxT3<F, R1, E1, B>

function chainRec_<F>(M: MonadRec<F>) {
  const to = toMonad(M)
  const lift = liftFx()

  return <A, B>(f: Arity1<A, FxT<F, Either<A, B>>>) => (a: A): FxT<F, B> => {
    const fbm = pipe(
      f(a),
      to,
      M.chain(
        match(
          M.chainRec((a) => pipe(a, f, to)),
          M.of,
        ),
      ),
    )

    return lift(fbm) as FxT<F, B>
  }
}
