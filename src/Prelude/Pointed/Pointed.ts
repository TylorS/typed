import { HKT, HKT2, HKT3, HKT4, Kind, Kind2, Kind3, Kind4, Params, TypeOf } from '@/Prelude/HKT'

export interface Pointed<T extends HKT> {
  readonly of: <A>(value: A) => TypeOf<Omit<T, Params.A> & { readonly [Params.A]: A }>
}

export interface Pointed1<T extends HKT> {
  readonly of: <A>(value: A) => Kind<T, A>
}

export interface Pointed2<T extends HKT2> {
  readonly of: <A, E = T[Params.E]>(value: A) => Kind2<T, E, A>
}

export interface Pointed3<T extends HKT3> {
  readonly of: <A, R = T[Params.R], E = T[Params.E]>(value: A) => Kind3<T, R, E, A>
}

export interface Pointed4<T extends HKT4> {
  readonly of: <A, S = T[Params.S], R = T[Params.R], E = T[Params.E]>(
    value: A,
  ) => Kind4<T, S, R, E, A>
}
