import { Fx } from '@fp/Fx/Fx'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { Monad, Monad1, Monad2, Monad3 } from 'fp-ts/dist/Monad'

export function toMonadUnsafe<F extends URIS>(
  M: Monad1<F>,
): <E extends Kind<F, any>, R>(fx: Fx<E, R>) => Kind<F, R>

export function toMonadUnsafe<F extends URIS2>(
  M: Monad2<F>,
): <E extends Kind2<F, S, any>, S, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonadUnsafe<F extends URIS2, S>(
  M: Monad2<F>,
): <E extends Kind2<F, S, any>, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonadUnsafe<F extends URIS3>(
  M: Monad3<F>,
): <E extends Kind3<F, S, T, any>, S, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonadUnsafe<F extends URIS3, S>(
  M: Monad3<F>,
): <E extends Kind3<F, S, T, any>, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonadUnsafe<F extends URIS3, S, T>(
  M: Monad3<F>,
): <E extends Kind3<F, S, T, any>, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonadUnsafe<F>(M: Monad<F>): <E extends HKT<F, any>, R>(fx: Fx<E, R>) => HKT<F, R>

/**
 * Using a Monad that also implements M, we can create a stack-UNSAFE interpreter for do-notation
 * using Fx + generators.
 */
export function toMonadUnsafe<F>(M: Monad<F>) {
  return function fxToMonad<E extends HKT<F, any>, R, N = unknown>(fx: Fx<E, R, N>): HKT<F, R> {
    const generator = fx[Symbol.iterator]()
    const result = generator.next()

    return runFxMonad(generator, result, M)
  }
}

function runFxMonad<E extends HKT<F, any>, R, N, F>(
  generator: Generator<E, R, N>,
  result: IteratorResult<E, R>,
  M: Monad<F>,
): HKT<F, R> {
  if (result.done) {
    return M.of(result.value)
  }

  return pipe(
    result.value,
    M.chain((a) => runFxMonad(generator, generator.next(a), M)),
  )
}
