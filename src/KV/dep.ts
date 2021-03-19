import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { WidenI } from '@typed/fp/Widen'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { GetKV, GetKV2, GetKV3 } from './getKV'
import { op as op_ } from './op'

export function dep<F extends URIS4>(
  M: MonadReader4<F>,
): <S, E, A>() => <K extends PropertyKey>(
  key: K,
) => Kind4<F, S, WidenI<Readonly<Record<K, A>> | GetKV3<F>>, E, A>

export function dep<F extends URIS4, E>(
  M: MonadReader4<F>,
): <S, A>() => <K extends PropertyKey>(
  key: K,
) => Kind4<F, S, WidenI<Readonly<Record<K, A>> | GetKV3<F>>, E, A>

export function dep<F extends URIS3>(
  M: MonadReader3<F>,
): <E, A>() => <K extends PropertyKey>(
  key: K,
) => Kind3<F, WidenI<Readonly<Record<K, A>> | GetKV3<F>>, E, A>

export function dep<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <A>() => <K extends PropertyKey>(
  key: K,
) => Kind3<F, WidenI<Readonly<Record<K, A>> | GetKV3<F>>, E, A>

export function dep<F extends URIS2>(
  M: MonadReader2<F>,
): <A>() => <K extends PropertyKey>(
  key: K,
) => Kind2<F, WidenI<Readonly<Record<K, A>> | GetKV2<F>>, A>

export function dep<F>(
  M: MonadReader<F>,
): <A>() => <K extends PropertyKey>(key: K) => HKT2<F, WidenI<Readonly<Record<K, A>> | GetKV<F>>, A>

/**
 * A helper from constructing an operation that needs to be provided.
 */
export function dep<F>(M: MonadReader<F>) {
  const op = op_(M)

  return <A>() => <K extends PropertyKey>(key: K) =>
    op<A>()(key)(M.of as <A>(value: A) => HKT2<F, never, A>)
}
