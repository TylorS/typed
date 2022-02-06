import { HKT, Kind, Params } from '@/HKT'
import { Semigroupoid } from '@/Semigroupoid'

export interface Category<T extends HKT> extends Semigroupoid<T> {
  readonly id: <A>() => Kind<T, T[Params.S], T[Params.R], A, A>
}
