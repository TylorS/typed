import { HKT, Kind, Params } from '@/HKT'

export interface Pointed<T extends HKT> {
  readonly of: <A>(value: A) => Kind<T, T[Params.S], T[Params.R], T[Params.E], A>
}
