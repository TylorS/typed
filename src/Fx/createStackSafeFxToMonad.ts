import { ChainRec, ChainRec1, ChainRec2, ChainRec3 } from 'fp-ts/ChainRec'
import { left, right } from 'fp-ts/Either'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad3 } from 'fp-ts/Monad'

import { Fx } from './Fx'

export function createStackSafeFxToMonad<F extends URIS>(
  chainRec: Monad1<F> & ChainRec1<F>,
): <E extends ReadonlyArray<Kind<F, any>>, R>(fx: Fx<E, R>) => Kind<F, R>

export function createStackSafeFxToMonad<F extends URIS2>(
  chainRec: Monad2<F> & ChainRec2<F>,
): <E extends ReadonlyArray<Kind2<F, S, any>>, S, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function createStackSafeFxToMonad<F extends URIS2, S>(
  chainRec: Monad2<F> & ChainRec2<F>,
): <E extends ReadonlyArray<Kind2<F, S, any>>, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function createStackSafeFxToMonad<F extends URIS3>(
  chainRec: Monad3<F> & ChainRec3<F>,
): <E extends ReadonlyArray<Kind3<F, S, T, any>>, S, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function createStackSafeFxToMonad<F extends URIS3, S>(
  chainRec: Monad3<F> & ChainRec3<F>,
): <E extends ReadonlyArray<Kind3<F, S, T, any>>, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function createStackSafeFxToMonad<F extends URIS3, S, T>(
  chainRec: Monad3<F> & ChainRec3<F>,
): <E extends ReadonlyArray<Kind3<F, S, T, any>>, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function createStackSafeFxToMonad<F>(
  chainRec: Monad<F> & ChainRec<F>,
): <E extends ReadonlyArray<HKT<F, any>>, R>(fx: Fx<E, R>) => HKT<F, R>

/**
 * Using a Monad that also implements ChainRec, we can create a stack-safe interpreter for do-notation
 * using Fx + generators.
 */
export function createStackSafeFxToMonad<F>(chainRec: Monad<F> & ChainRec<F>) {
  return function fxToMonad<E extends ReadonlyArray<HKT<F, any>>, R>(fx: Fx<E, R>): HKT<F, R> {
    const generator = fx[Symbol.iterator]()
    const result = generator.next()

    if (result.done) {
      return chainRec.of(result.value)
    }

    return chainRec.chain(result.value, (initial) =>
      chainRec.chainRec(initial, (a) => {
        const result = generator.next(a)

        return result.done ? chainRec.of(right(result.value)) : chainRec.map(result.value, left)
      }),
    )
  }
}
