/**
 * MonadRec is a Typeclass which is the intersecion between a Monad and ChainRec
 *
 * @since 0.9.2
 */
import { ChainRec, ChainRec1, ChainRec2, ChainRec2C, ChainRec3, ChainRec4 } from 'fp-ts/ChainRec'
import { URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad2C, Monad3, Monad4 } from 'fp-ts/Monad'

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface MonadRec<F> extends Monad<F>, ChainRec<F> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface MonadRec1<F extends URIS> extends Monad1<F>, ChainRec1<F> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface MonadRec2<F extends URIS2> extends Monad2<F>, ChainRec2<F> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface MonadRec2C<F extends URIS2, E> extends Monad2C<F, E>, ChainRec2C<F, E> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface MonadRec3<F extends URIS3> extends Monad3<F>, ChainRec3<F> {}

/**
 * @since 0.9.2
 * @category Typeclass
 */
export interface MonadRec4<F extends URIS4> extends Monad4<F>, ChainRec4<F> {}
