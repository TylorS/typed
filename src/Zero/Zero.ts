import { HKT, Kind, Params } from '@/HKT'

export interface Zero<T extends HKT> {
  readonly zero: <A>() => Kind<T, T[Params.S], T[Params.R], T[Params.E], A>
}
