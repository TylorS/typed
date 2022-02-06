import { Arity1 } from '@/function'
import { HKT, Kind } from '@/HKT'

export interface Apply<T extends HKT> {
  readonly ap: <S, R, E, A>(
    value: Kind<T, S, R, E, A>,
  ) => <B>(fn: Kind<T, S, R, E, Arity1<A, B>>) => Kind<T, S, R, E, B>
}
