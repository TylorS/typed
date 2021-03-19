import {
  FromReader,
  FromReader2,
  FromReader3,
  FromReader3C,
  FromReader4,
} from 'fp-ts/dist/FromReader'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { ask as ask_ } from 'fp-ts/dist/Reader'

export function ask<F extends URIS4>(M: FromReader4<F>): <S, E, A>() => Kind4<F, S, A, E, A>
export function ask<F extends URIS3, E>(M: FromReader3C<F, E>): <A>() => Kind3<F, A, E, A>
export function ask<F extends URIS3>(M: FromReader3<F>): <E, A>() => Kind3<F, A, E, A>
export function ask<F extends URIS2>(M: FromReader2<F>): <A>() => Kind2<F, A, A>
export function ask<F>(M: FromReader<F>): <A>() => HKT2<F, A, A>

export function ask<F>(M: FromReader<F>) {
  return <A>(): HKT2<F, A, A> => M.fromReader(ask_<A>())
}
