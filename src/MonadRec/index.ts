import {
  ChainRec,
  ChainRec1,
  ChainRec2,
  ChainRec2C,
  ChainRec3,
  ChainRec3C,
  ChainRec4,
} from 'fp-ts/dist/ChainRec'
import { URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Monad, Monad1, Monad2, Monad2C, Monad3, Monad3C, Monad4 } from 'fp-ts/dist/Monad'

export interface MonadRec<F> extends Monad<F>, ChainRec<F> {}

export interface MonadRec1<F extends URIS> extends Monad1<F>, ChainRec1<F> {}

export interface MonadRec2<F extends URIS2> extends Monad2<F>, ChainRec2<F> {}
export interface MonadRec2C<F extends URIS2, E> extends Monad2C<F, E>, ChainRec2C<F, E> {}

export interface MonadRec3<F extends URIS3> extends Monad3<F>, ChainRec3<F> {}
export interface MonadRec3C<F extends URIS3, E> extends Monad3C<F, E>, ChainRec3C<F, E> {}

export interface MonadRec4<F extends URIS4> extends Monad4<F>, ChainRec4<F> {}
