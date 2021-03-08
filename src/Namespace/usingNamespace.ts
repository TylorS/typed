import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { pipe } from 'fp-ts/dist/function'
import { HKT, HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { CurrentNamespace } from './getCurrentNamespace'
import { Namespace } from './Namespace'

export function usingNamespace<F extends URIS2>(
  M: UseSome2<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <A>(kind: Kind2<F, CurrentNamespace<K>, A>): Kind2<F, never, A>
  <E, A>(kind: Kind2<F, E & CurrentNamespace<K>, A>): Kind2<F, E, A>
}

export function usingNamespace<F extends URIS3>(
  M: UseSome3<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <E, A>(kind: Kind3<F, CurrentNamespace<K>, E, A>): Kind3<F, never, E, A>
  <R, E, A>(kind: Kind3<F, R & CurrentNamespace<K>, E, A>): Kind3<F, R, E, A>
}

export function usingNamespace<F extends URIS4>(
  M: UseSome4<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => {
  <S, E, A>(kind: Kind4<F, S, CurrentNamespace<K>, E, A>): Kind4<F, S, never, E, A>
  <S, R, E, A>(kind: Kind4<F, S, R & CurrentNamespace<K>, E, A>): Kind4<F, S, R, E, A>
}

export function usingNamespace<F>(
  M: UseSome<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => <A>(kind: HKT<F, A>) => HKT<F, A>

export function usingNamespace<F>(M: UseSome<F>) {
  return <K extends PropertyKey = PropertyKey>(namespace: Namespace<K>) => <A>(
    kind: HKT2<F, CurrentNamespace<K>, A>,
  ) =>
    pipe(
      kind,
      M.useSome<CurrentNamespace<K>>({ currentNamespace: namespace }),
    )
}
