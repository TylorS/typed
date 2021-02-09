import { doFx, liftFx, pure } from '@fp/Fx'
import { Arity1 } from '@fp/lambda'
import { UnionWiden, WideningOptions } from '@fp/Widen'
import { Apply, Apply1, Apply2, Apply2C, Apply3 } from 'fp-ts/dist/Apply'
import { pipe } from 'fp-ts/dist/function'
import { URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { Monad, Monad1, Monad2, Monad2C, Monad3 } from 'fp-ts/dist/Monad'

import { chain_, map_ } from './_internal'
import { createFxToMonad } from './createFxToMonad'
import { FxM, FxM1, FxM2, FxM3 } from './FxM'
import { FxT } from './FxT'

export function getFxM<F extends URIS>(monad: Monad1<F> & Apply1<F>): FxM1<F>

export function getFxM<F extends URIS2, W extends WideningOptions = UnionWiden>(
  monad: Monad2<F> & Apply2<F>,
): FxM2<F, W>

export function getFxM<F extends URIS2, E, W extends WideningOptions = UnionWiden>(
  monad: Monad2C<F, E> & Apply2C<F, E>,
): FxM2<F, W>

export function getFxM<F extends URIS3, W extends WideningOptions = UnionWiden>(
  monad: Monad3<F> & Apply3<F>,
): FxM3<F, W>

/**
 * Fx monad transformer for monads. Is NOT stack-safe unless your Monad is asynchronous.
 */
export function getFxM<F extends string>(monad: Monad<F> & Apply<F>): FxM<F> {
  const fromMonad = liftFx<F>()
  const toMonad = createFxToMonad(monad)
  const ap = <A>(fa: FxT<F, A>) => <B>(fab: FxT<F, Arity1<A, B>>): FxT<F, B> =>
    pipe(toMonad(fab), monad.ap(toMonad(fa)), fromMonad) as FxT<F, B>

  return {
    of: pure,
    chain: chain_,
    map: map_,
    ap,
    fromMonad,
    toMonad,
    doMonad: (f) => doFx(() => f(fromMonad)),
  }
}
