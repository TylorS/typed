import { Arity1 } from '@/function'
import { Functor } from '@/Functor'
import { HKT, Kind } from '@/HKT'

export interface Bifunctor<T extends HKT> extends Functor<T> {
  readonly bimap: <A, B>(
    f: Arity1<A, B>,
  ) => <C, D>(g: Arity1<C, D>) => <S, R>(kind: Kind<T, S, R, A, C>) => Kind<T, S, R, B, D>

  readonly mapLeft: <E1, E2>(
    f: Arity1<E1, E2>,
  ) => <S, R, A>(kind: Kind<T, S, R, E1, A>) => Kind<T, S, R, E2, A>
}
