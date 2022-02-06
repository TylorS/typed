import { Functor } from '@/Functor'
import { HKT, Kind } from '@/HKT'

export interface Chain<T extends HKT> extends Functor<T> {
  readonly chain: <A, S, R, E, B>(
    f: (a: A) => Kind<T, S, R, E, B>,
  ) => (kind: Kind<T, S, R, E, A>) => Kind<T, S, R, E, B>
}
