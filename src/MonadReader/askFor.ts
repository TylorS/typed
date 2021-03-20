import { UseAll, UseAll2, UseAll3, UseAll3C, UseAll4 } from '@typed/fp/Provide'
import {
  FromReader,
  FromReader2,
  FromReader3,
  FromReader3C,
  FromReader4,
} from 'fp-ts/dist/FromReader'
import { identity, pipe } from 'fp-ts/dist/function'
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export function askFor<F extends URIS4>(
  M: FromReader4<F> & Functor4<F> & UseAll4<F>,
): <S, R, E, A>(hkt: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, Kind4<F, S, never, E, A>>

export function askFor<F extends URIS3>(
  M: FromReader3<F> & Functor3<F> & UseAll3<F>,
): <R, E, A>(hkt: Kind3<F, R, E, A>) => Kind3<F, R, E, Kind3<F, never, E, A>>

export function askFor<F extends URIS3, E>(
  M: FromReader3C<F, E> & Functor3C<F, E> & UseAll3C<F, E>,
): <R, A>(hkt: Kind3<F, R, E, A>) => Kind3<F, R, E, Kind3<F, never, E, A>>

export function askFor<F extends URIS2>(
  M: FromReader2<F> & Functor2<F> & UseAll2<F>,
): <E, A>(hkt: Kind2<F, E, A>) => Kind2<F, E, Kind2<F, never, A>>

export function askFor<F>(
  M: FromReader<F> & Functor<F> & UseAll<F>,
): <E, A>(hkt: HKT2<F, E, A>) => HKT2<F, E, HKT2<F, never, A>>

export function askFor<F>(M: FromReader<F> & Functor<F> & UseAll<F>) {
  return <E, A>(hkt: HKT2<F, E, A>) =>
    pipe(
      M.fromReader(identity),
      M.map((env) => pipe(hkt, M.useAll(env))),
    )
}
