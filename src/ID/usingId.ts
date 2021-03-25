import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { CurrentID } from './getCurrentID'
import { ID } from './ID'

export function usingID<F extends URIS2>(
  M: UseSome2<F>,
): <K>(
  id: ID<K>,
) => {
  <A>(kind: Kind2<F, CurrentID<K>, A>): Kind2<F, never, A>
  <E, A>(kind: Kind2<F, E & CurrentID<K>, A>): Kind2<F, E, A>
}

export function usingID<F extends URIS3>(
  M: UseSome3<F>,
): <K>(
  id: ID<K>,
) => {
  <E, A>(kind: Kind3<F, CurrentID<K>, E, A>): Kind3<F, never, E, A>
  <R, E, A>(kind: Kind3<F, R & CurrentID<K>, E, A>): Kind3<F, R, E, A>
}

export function usingID<F extends URIS4>(
  M: UseSome4<F>,
): <K>(
  id: ID<K>,
) => {
  <S, E, A>(kind: Kind4<F, S, CurrentID<K>, E, A>): Kind4<F, S, never, E, A>
  <S, R, E, A>(kind: Kind4<F, S, R & CurrentID<K>, E, A>): Kind4<F, S, R, E, A>
}

export function usingID<F>(
  M: UseSome<F>,
): <K>(id: ID<K>) => <E, A>(kind: HKT2<F, WidenI<E | CurrentID<K>>, A>) => HKT2<F, E, A>

export function usingID<F>(M: UseSome<F>) {
  return <K>(id: ID<K>) => <A>(kind: HKT2<F, CurrentID<K>, A>) =>
    pipe(
      kind,
      M.useSome<CurrentID<K>>({ currentID: id }),
    )
}
