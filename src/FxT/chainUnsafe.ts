import { Arity1 } from '@typed/fp/lambda'
import { UnionWiden, WideningOptions } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { Monad } from 'fp-ts/dist/Monad'

import { ChainFxT } from './chain'
import { FxT } from './FxT'
import { liftFx } from './liftFx'
import { toMonadUnsafe } from './toMonadUnsafe'

export function chainUnsafe<F, W extends WideningOptions = UnionWiden>(
  M: Monad<F>,
): ChainFxT<F, W> {
  return chain_(M) as ChainFxT<F, W>
}

function chain_<F>(M: Monad<F>) {
  const to = toMonadUnsafe(M)
  const lift = liftFx()

  return <A, B>(f: Arity1<A, FxT<F, B>>) => (fa: FxT<F, A>): FxT<F, B> => {
    const fbm = pipe(
      fa,
      to,
      M.chain((a) => pipe(a, f, to)),
    )

    return lift(fbm) as FxT<F, B>
  }
}
