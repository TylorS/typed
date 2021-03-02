import { Resume } from '@typed/fp/Resume'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export interface FromResume<F> {
  readonly fromResume: <A>(resume: Resume<A>) => HKT<F, A>
}

export interface FromResume1<F extends URIS> {
  readonly fromResume: <A>(resume: Resume<A>) => Kind<F, A>
}

export interface FromResume2<F extends URIS2> {
  readonly fromResume: <E, A>(resume: Resume<A>) => Kind2<F, E, A>
}

export interface FromResume2C<F extends URIS2, E> {
  readonly fromResume: <A>(resume: Resume<A>) => Kind2<F, E, A>
}

export interface FromResume3<F extends URIS3> {
  readonly fromResume: <R, E, A>(resume: Resume<A>) => Kind3<F, R, E, A>
}

export interface FromResume3C<F extends URIS3, E> {
  readonly fromResume: <R, A>(resume: Resume<A>) => Kind3<F, R, E, A>
}

export interface FromResume4<F extends URIS4> {
  readonly fromResume: <S, R, E, A>(resume: Resume<A>) => Kind4<F, S, R, E, A>
}

export interface FromResume4C<F extends URIS4, E> {
  readonly fromResume: <S, R, A>(resume: Resume<A>) => Kind4<F, S, R, E, A>
}
