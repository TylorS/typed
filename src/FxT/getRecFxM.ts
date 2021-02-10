import { doFx, pure } from '@fp/Fx'
import { liftFx } from '@fp/Fx/liftFx'
import { Arity1 } from '@fp/lambda'
import { MonadRec, MonadRec1, MonadRec2, MonadRec2C, MonadRec3 } from '@fp/MonadRec'
import { UnionWiden, WideningOptions } from '@fp/Widen'
import { Apply, Apply1, Apply2, Apply2C, Apply3 } from 'fp-ts/dist/Apply'
import { pipe } from 'fp-ts/dist/function'
import { URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { chain_, map_ } from './_internal'
import { createRecFxToMonad } from './createRecFxToMonad'
import { FxM, FxM1, FxM2, FxM3 } from './FxM'
import { FxT } from './FxT'

export function getRecFxM<F extends URIS>(monad: MonadRec1<F> & Apply1<F>): FxM1<F>

export function getRecFxM<F extends URIS2, W extends WideningOptions = UnionWiden>(
  monad: MonadRec2<F> & Apply2<F>,
): FxM2<F, W>

export function getRecFxM<F extends URIS2, E, W extends WideningOptions = UnionWiden>(
  monad: MonadRec2C<F, E> & Apply2C<F, E>,
): FxM2<F, W>

export function getRecFxM<F extends URIS3, W extends WideningOptions = UnionWiden>(
  monad: MonadRec3<F> & Apply3<F>,
): FxM3<F, W>

/**
 * Fx monad transformer for stack-safe monads.
 */
export function getRecFxM<F extends string>(monad: MonadRec<F> & Apply<F>): FxM<F> {
  const fromMonad = liftFx<F>()
  const toMonad = createRecFxToMonad(monad)
  const ap = <A>(fa: FxT<F, A>) => <B>(fab: FxT<F, Arity1<A, B>>): FxT<F, B> =>
    fromMonad(pipe(toMonad(fab), monad.ap(toMonad(fa))))

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
