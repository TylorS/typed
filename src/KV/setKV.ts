import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { KV, KV2, KV3, KV4 } from './KV'

export interface SetKV<F> {
  readonly setKV: <A>(value: A) => <K, E>(kv: KV<F, K, E, A>) => HKT2<F, E, A>
}

export interface SetKV2<F extends URIS2> {
  readonly setKV: <A>(value: A) => <K, E>(kv: KV2<F, K, E, A>) => Kind2<F, E, A>
}

export interface SetKV2C<F extends URIS2, E> {
  readonly setKV: <A>(value: A) => <K>(kv: KV2<F, K, E, A>) => Kind2<F, E, A>
}

export interface SetKV3<F extends URIS3> {
  readonly setKV: <A>(value: A) => <K, R, E>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface SetKV3C<F extends URIS3, E> {
  readonly setKV: <A>(value: A) => <K, R>(kv: KV3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface SetKV4<F extends URIS4> {
  readonly setKV: <A>(value: A) => <K, S, R, E>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, R, E, A>
}

export interface SetKV4C<F extends URIS4, E> {
  readonly setKV: <K, S, R, A>(kv: KV4<F, K, S, R, E, A>, value: A) => Kind4<F, S, R, E, A>
}

export function setKV<F extends URIS2>(
  M: MonadReader2<F>,
): <A>(value: A) => <K, E>(kv: KV2<F, K, E, A>) => Kind2<F, WidenI<E | SetKV2<F>>, A>

export function setKV<F extends URIS3>(
  M: MonadReader3<F>,
): <A>(value: A) => <K, R, E>(kv: KV3<F, K, R, E, A>) => Kind3<F, WidenI<R | SetKV3<F>>, E, A>

export function setKV<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <A>(value: A) => <K, R>(kv: KV3<F, K, R, E, A>) => Kind3<F, WidenI<R | SetKV3C<F, E>>, E, A>

export function setKV<F extends URIS4>(
  M: MonadReader4<F>,
): <A>(
  value: A,
) => <K, S, R, E>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | SetKV4<F>>, E, A>

export function setKV<F>(
  M: MonadReader<F>,
): <A>(value: A) => <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, WidenI<E | SetKV<F>>, A>

export function setKV<F>(M: MonadReader<F>) {
  return <A>(value: A) => <K, E>(kv: KV<F, K, E, A>): HKT2<F, WidenI<E | SetKV<F>>, A> =>
    pipe(
      ask(M)<SetKV<F>>(),
      M.chain((x) => x.setKV(value)(kv)),
    ) as HKT2<F, WidenI<E | SetKV<F>>, A>
}
