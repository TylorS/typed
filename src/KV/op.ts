import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { fromKey } from './fromKey'
import { GetKV, getKV, GetKV2, GetKV3, GetKV4 } from './getKV'

export function op<F extends URIS4>(
  M: MonadReader4<F>,
): <Op>() => <K extends PropertyKey>(
  key: K,
) => <S, R, E, A>(
  f: (op: Op) => Kind4<F, S, R, E, A>,
) => Kind4<F, S, WidenI<Readonly<Record<K, Op>> | GetKV4<F> | R>, E, A>

export function op<F extends URIS3>(
  M: MonadReader3<F>,
): <Op>() => <K extends PropertyKey>(
  key: K,
) => <R, E, A>(
  f: (op: Op) => Kind3<F, R, E, A>,
) => Kind3<F, WidenI<Readonly<Record<K, Op>> | GetKV3<F> | R>, E, A>

export function op<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <Op>() => <K extends PropertyKey>(
  key: K,
) => <R, A>(
  f: (op: Op) => Kind3<F, R, E, A>,
) => Kind3<F, WidenI<Readonly<Record<K, Op>> | GetKV3<F> | R>, E, A>

export function op<F extends URIS2>(
  M: MonadReader2<F>,
): <Op>() => <K extends PropertyKey>(
  key: K,
) => <E, A>(
  f: (op: Op) => Kind2<F, E, A>,
) => Kind2<F, WidenI<Readonly<Record<K, Op>> | GetKV2<F> | E>, A>

export function op<F>(
  M: MonadReader<F>,
): <Op>() => <K extends PropertyKey>(
  key: K,
) => <E, A>(
  f: (op: Op) => HKT2<F, E, A>,
) => HKT2<F, WidenI<Readonly<Record<K, Op>> | GetKV<F> | E>, A>

/**
 * A helper from constructing an operation that needs to be provided.
 */
export function op<F>(M: MonadReader<F>) {
  const get = getKV(M)
  const from = fromKey(M)

  return <Op>() => <K extends PropertyKey>(key: K) => {
    const getOp = get(from<Op>()(key))

    return <E, A>(f: (op: Op) => HKT2<Op, E, A>) => pipe(getOp, M.chain(f as any))
  }
}
