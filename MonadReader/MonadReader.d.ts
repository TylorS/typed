import { FromReader, FromReader2, FromReader3, FromReader3C, FromReader4 } from 'fp-ts/dist/FromReader';
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT';
import { Monad, Monad2, Monad3, Monad3C, Monad4 } from 'fp-ts/dist/Monad';
export interface MonadReader<F> extends Monad<F>, FromReader<F> {
}
export interface MonadReader2<F extends URIS2> extends Monad2<F>, FromReader2<F> {
}
export interface MonadReader3<F extends URIS3> extends Monad3<F>, FromReader3<F> {
}
export interface MonadReader3C<F extends URIS3, E> extends Monad3C<F, E>, FromReader3C<F, E> {
}
export interface MonadReader4<F extends URIS4> extends Monad4<F>, FromReader4<F> {
}
//# sourceMappingURL=MonadReader.d.ts.map