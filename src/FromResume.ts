import { Hkt } from './Hkt'
import { Resume } from './Resume'
import { URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'

export type FromResume<F> = {
  readonly fromResume: <A>(resume: Resume<A>) => Hkt<F, [A]>
}

export type FromResume1<F extends URIS> = {
  readonly fromResume: <A>(resume: Resume<A>) => Hkt<F, [A]>
}

export type FromResume2<F extends URIS2> = {
  readonly fromResume: <A, E = never>(resume: Resume<A>) => Hkt<F, [E, A]>
}

export type FromResume2C<F extends URIS2, E> = {
  readonly fromResume: <A>(resume: Resume<A>) => Hkt<F, [E, A]>
}

export type FromResume3<F extends URIS3> = {
  readonly fromResume: <A, R = never, E = never>(resume: Resume<A>) => Hkt<F, [R, E, A]>
}

export type FromResume3C<F extends URIS3, E> = {
  readonly fromResume: <A, R = never>(resume: Resume<A>) => Hkt<F, [R, E, A]>
}

export type FromResume4<F extends URIS4> = {
  readonly fromResume: <A, S = unknown, R = unknown, E = never>(
    resume: Resume<A>,
  ) => Hkt<F, [S, R, E, A]>
}
