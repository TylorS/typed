import { doFx, pure } from '@fp/Fx'
import { liftFx } from '@fp/FxT/liftFx'
import { MonadRec, MonadRec1, MonadRec2, MonadRec2C, MonadRec3 } from '@fp/MonadRec'
import { UnionWiden, WideningOptions } from '@fp/Widen'
import { URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { chain_, map_ } from './_internal'
import { toMonad } from './toMonad'
import { FxM, FxM1, FxM2, FxM3 } from './FxM'

export function getRecFxM<F extends URIS>(monad: MonadRec1<F>): FxM1<F>

export function getRecFxM<F extends URIS2, W extends WideningOptions = UnionWiden>(
  monad: MonadRec2<F>,
): FxM2<F, W>

export function getRecFxM<F extends URIS2, E, W extends WideningOptions = UnionWiden>(
  monad: MonadRec2C<F, E>,
): FxM2<F, W>

export function getRecFxM<F extends URIS3, W extends WideningOptions = UnionWiden>(
  monad: MonadRec3<F>,
): FxM3<F, W>

export function getRecFxM<F extends string>(monad: MonadRec<F>): FxM<F>

/**
 * Fx monad transformer for stack-safe monads.
 */
export function getRecFxM<F extends string>(monad: MonadRec<F>): FxM<F> {
  const fromMonad = liftFx<F>()

  return {
    of: pure,
    chain: chain_,
    map: map_,
    fromMonad,
    toMonad: toMonad(monad),
    doMonad: (f) => doFx(() => f(fromMonad)),
  }
}
