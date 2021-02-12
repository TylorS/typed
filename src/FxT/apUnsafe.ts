import { Arity1 } from '@fp/lambda'
import { Apply } from 'fp-ts/Apply'
import { pipe } from 'fp-ts/function'
import { Monad } from 'fp-ts/Monad'

import { FxT } from './FxT'
import { liftFx } from './liftFx'
import { toMonadUnsafe } from './toMonadUnsafe'

export function apUnsafe<F>(M: Monad<F> & Apply<F>) {
  const lift = liftFx()
  const to = toMonadUnsafe(M)

  return <A>(fa: FxT<F, A>) => <B>(fab: FxT<F, Arity1<A, B>>): FxT<F, B> =>
    lift(pipe(to(fab), M.ap(to(fa)))) as FxT<F, B>
}
