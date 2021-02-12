import { Fx } from '@fp/Fx'
import { MonadRec, MonadRec1, MonadRec2, MonadRec3 } from '@fp/MonadRec'
import { left, right } from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

export function toMonad<F extends URIS>(
  M: MonadRec1<F>,
): <E extends Kind<F, any>, R>(fx: Fx<E, R>) => Kind<F, R>

export function toMonad<F extends URIS2>(
  M: MonadRec2<F>,
): <E extends Kind2<F, S, any>, S, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonad<F extends URIS2, S>(
  M: MonadRec2<F>,
): <E extends Kind2<F, S, any>, R>(fx: Fx<E, R>) => Kind2<F, S, R>

export function toMonad<F extends URIS3>(
  M: MonadRec3<F>,
): <E extends Kind3<F, S, T, any>, S, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonad<F extends URIS3, S>(
  M: MonadRec3<F>,
): <E extends Kind3<F, S, T, any>, T, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonad<F extends URIS3, S, T>(
  M: MonadRec3<F>,
): <E extends Kind3<F, S, T, any>, R>(fx: Fx<E, R>) => Kind3<F, S, T, R>

export function toMonad<F>(M: MonadRec<F>): <E extends HKT<F, any>, R>(fx: Fx<E, R>) => HKT<F, R>

/**
 * Using a Monad that also implements MonadRec, we can create a stack-safe interpreter for do-notation
 * using Fx + generators.
 */
export function toMonad<F>(M: MonadRec<F>) {
  return function fxToMonad<E extends HKT<F, any>, R>(fx: Fx<E, R>): HKT<F, R> {
    const generator = fx[Symbol.iterator]()
    const result = generator.next()

    if (result.done) {
      return M.of(result.value)
    }

    return pipe(
      result.value,
      M.chain(
        M.chainRec((a) => {
          const result = generator.next(a)

          return result.done ? pipe(result.value, right, M.of) : pipe(result.value, M.map(left))
        }),
      ),
    )
  }
}
