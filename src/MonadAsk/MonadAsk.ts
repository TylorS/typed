import { Ask, Ask2, Ask2C, Ask3, Ask3C, Ask4, Ask4C } from '@typed/fp/Ask'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Monad, Monad2, Monad2C, Monad3, Monad3C, Monad4 } from 'fp-ts/dist/Monad'

export interface MonadAsk<F> extends Monad<F>, Ask<F> {}

export interface MonadAsk2<F extends URIS2> extends Monad2<F>, Ask2<F> {}
export interface MonadAsk2C<F extends URIS2, E> extends Monad2C<F, E>, Ask2C<F, E> {}

export interface MonadAsk3<F extends URIS3> extends Monad3<F>, Ask3<F> {}
export interface MonadAsk3C<F extends URIS3, E> extends Monad3C<F, E>, Ask3C<F, E> {}

export interface MonadAsk4<F extends URIS4> extends Monad4<F>, Ask4<F> {}
export interface MonadAsk4C<F extends URIS4, E> extends Monad4<F>, Ask4C<F, E> {}
