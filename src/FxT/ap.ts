import { Arity1 } from '@fp/lambda'
import { MonadRec, MonadRec1, MonadRec2, MonadRec3 } from '@fp/MonadRec'
import { UnionWiden, Widen, WideningOptions } from '@fp/Widen'
import { Apply, Apply1, Apply2, Apply3 } from 'fp-ts/dist/Apply'
import { pipe } from 'fp-ts/dist/function'
import { URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { FxT, FxT1, FxT2, FxT3 } from './FxT'
import { liftFx } from './liftFx'
import { toMonad } from './toMonad'

export function ap<F extends URIS>(
  M: MonadRec1<F> & Apply1<F>,
): <A>(fa: FxT1<F, A>) => <B>(fab: FxT1<F, Arity1<A, B>>) => FxT1<F, B>

export function ap<F extends URIS2, W extends WideningOptions = UnionWiden>(
  M: MonadRec2<F> & Apply2<F>,
): <E1, A>(
  fa: FxT2<F, E1, A>,
) => <E2, B>(fab: FxT2<F, E2, Arity1<A, B>>) => FxT2<F, Widen<E1 | E2, W[2]>, B>

export function ap<F extends URIS2, E1, W extends WideningOptions = UnionWiden>(
  M: MonadRec2<F> & Apply2<F>,
): <A>(
  fa: FxT2<F, E1, A>,
) => <E2, B>(fab: FxT2<F, E2, Arity1<A, B>>) => FxT2<F, Widen<E1 | E2, W[2]>, B>

export function ap<F extends URIS3, W extends WideningOptions = UnionWiden>(
  M: MonadRec3<F> & Apply3<F>,
): <R1, E1, A>(
  fa: FxT3<F, R1, E1, A>,
) => <R2, E2, B>(
  fab: FxT3<F, R2, E2, Arity1<A, B>>,
) => FxT3<F, Widen<R1 | R2, W[3]>, Widen<E1 | E2, W[2]>, B>

export function ap<F>(
  M: MonadRec<F> & Apply<F>,
): <A>(fa: FxT<F, A>) => <B>(fab: FxT<F, Arity1<A, B>>) => FxT<F, B>

export function ap<F>(M: MonadRec<F> & Apply<F>) {
  const lift = liftFx()
  const to = toMonad(M)

  return <A>(fa: FxT<F, A>) => <B>(fab: FxT<F, Arity1<A, B>>): FxT<F, B> =>
    lift(pipe(to(fab), M.ap(to(fa)))) as FxT<F, B>
}
