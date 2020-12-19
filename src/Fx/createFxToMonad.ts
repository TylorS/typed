import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad3 } from 'fp-ts/Monad'

import { Fx } from './Fx'

export function createFxToMonad<F extends URIS>(
  M: Monad1<F>,
): <E extends ReadonlyArray<Kind<F, any>>, R>(fx: Fx<E, R>) => Kind<F, R>

export function createFxToMonad<F extends URIS2>(
  M: Monad2<F>,
): <E extends ReadonlyArray<Kind2<F, S, any>>, S, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function createFxToMonad<F extends URIS2, S>(
  M: Monad2<F>,
): <E extends ReadonlyArray<Kind2<F, S, any>>, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function createFxToMonad<F extends URIS3>(
  M: Monad3<F>,
): <E extends ReadonlyArray<Kind3<F, S, T, any>>, S, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function createFxToMonad<F extends URIS3, S>(
  M: Monad3<F>,
): <E extends ReadonlyArray<Kind3<F, S, T, any>>, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function createFxToMonad<F extends URIS3, S, T>(
  M: Monad3<F>,
): <E extends ReadonlyArray<Kind3<F, S, T, any>>, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function createFxToMonad<F>(
  M: Monad<F>,
): <E extends ReadonlyArray<HKT<F, any>>, R>(fx: Fx<E, R>) => HKT<F, R>

/**
 * Using a Monad that also implements M, we can create a stack-UNSAFE interpreter for do-notation
 * using Fx + generators.
 */
export function createFxToMonad<F>(M: Monad<F>) {
  return function fxToMonad<E extends ReadonlyArray<HKT<F, any>>, R>(fx: Fx<E, R>): HKT<F, R> {
    const generator = fx[Symbol.iterator]()
    const result = generator.next()

    return runFxMonad(generator, result, M)
  }
}

function runFxMonad<E extends ReadonlyArray<HKT<F, any>>, R, F>(
  generator: Iterator<E[number], R, unknown>,
  result: IteratorResult<E[number], R>,
  M: Monad<F>,
): HKT<F, R> {
  if (result.done) {
    return M.of(result.value)
  }

  return M.chain(result.value, (a) => runFxMonad(generator, generator.next(a), M))
}
