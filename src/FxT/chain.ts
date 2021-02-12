import { chain as chain_ } from '@fp/Fx'
import { Arity1 } from '@fp/lambda'
import { UnionWiden, Widen, WideningOptions } from '@fp/Widen'
import { URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { FxT, FxT1, FxT2, FxT3 } from './FxT'

export function chain<F, W extends WideningOptions = UnionWiden>(): Chain<F, W> {
  return chain_ as any
}

export type Chain<F, W extends WideningOptions = UnionWiden> = F extends URIS
  ? Chain1<F>
  : F extends URIS2
  ? Chain2<F, W>
  : F extends URIS3
  ? Chain3<F, W>
  : <A, B>(f: Arity1<A, FxT<F, B>>) => (fa: FxT<F, A>) => FxT<F, B>

export type Chain1<F extends URIS> = <A, B>(
  f: Arity1<A, FxT1<F, B>>,
) => (fa: FxT1<F, A>) => FxT1<F, B>

export type Chain2<F extends URIS2, W extends WideningOptions = UnionWiden> = <A, E1, B>(
  f: Arity1<A, FxT2<F, E1, B>>,
) => <E2>(fa: FxT2<F, E2, A>) => FxT2<F, Widen<E1 | E2, W[2]>, B>

export type Chain3<F extends URIS3, W extends WideningOptions = UnionWiden> = <A, R1, E1, B>(
  f: Arity1<A, FxT3<F, R1, E1, B>>,
) => <R2, E2>(fa: FxT3<F, R2, E2, A>) => FxT3<F, Widen<R1 | R2, W[3]>, Widen<E1 | E2, W[2]>, B>
