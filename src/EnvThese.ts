/**
 * EnvThese is a TheseT of Env.
 * @since 0.9.7
 */
import { Semigroup } from 'fp-ts/Semigroup'
import * as TH from 'fp-ts/These'
import * as TT from 'fp-ts/TheseT'

import * as E from './Env'

/**
 * @since 0.9.7
 * @category Model
 */
export interface EnvThese<R, E, A> extends E.Env<R, TH.These<E, A>> {}

/**
 * @since 0.9.7
 * @category Constructor
 */
export const getAp = <E>(S: Semigroup<E>) => TT.ap(E.Apply, S)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const bimap = TT.bimap(E.Functor)

/**
 * @since 0.9.7
 * @category Constructor
 */
export const both = TT.both(E.Pointed)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const getChain = <E>(S: Semigroup<E>) => TT.chain(E.Monad, S)

/**
 * @since 0.9.7
 * @category Constructor
 */
export const left = TT.left(E.Pointed)

/**
 * @since 0.9.7
 * @category Constructor
 */
export const leftF = TT.leftF(E.Chain)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const map = TT.map(E.Functor)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const mapLeft = TT.mapLeft(E.Functor)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const match = TT.match(E.Functor)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const matchW = TT.match(E.Functor) as <E, B, A, C, D>(
  onLeft: (e: E) => B,
  onRight: (a: A) => C,
  onBoth: (e: E, a: A) => D,
) => <R>(ma: E.Env<R, TH.These<E, A>>) => E.Env<R, B | C | D>

/**
 * @since 0.9.7
 * @category Combinator
 */
export const matchE = TT.matchE(E.Chain)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const matchEW = TT.matchE(E.Chain) as <E, R, B, A, C, D>(
  onLeft: (e: E) => E.Env<R, B>,
  onRight: (a: A) => E.Env<R, C>,
  onBoth: (e: E, a: A) => E.Env<R, D>,
) => (ma: E.Env<R, TH.These<E, A>>) => E.Env<R, B | C | D>

/**
 * @since 0.9.7
 * @category Constructor
 */
export const right = TT.right(E.Pointed)

/**
 * @since 0.9.7
 * @category Constructor
 */
export const rightF = TT.rightF(E.Chain)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const swap = TT.swap(E.Functor)

/**
 * @since 0.9.7
 * @category Combinator
 */
export const toTuple2 = TT.toTuple2(E.Functor)
