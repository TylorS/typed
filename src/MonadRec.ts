import { ChainRec, ChainRec1, ChainRec2, ChainRec2C, ChainRec3 } from 'fp-ts/ChainRec'
import { URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad2C, Monad3 } from 'fp-ts/Monad'

export interface MonadRec<F> extends Monad<F>, ChainRec<F> {}

export interface MonadRec1<F extends URIS> extends Monad1<F>, ChainRec1<F> {}

export interface MonadRec2<F extends URIS2> extends Monad2<F>, ChainRec2<F> {}

export interface MonadRec2C<F extends URIS2, E> extends Monad2C<F, E>, ChainRec2C<F, E> {}

export interface MonadRec3<F extends URIS3> extends Monad3<F>, ChainRec3<F> {}
