import { Chain, Chain1, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'
import { HKT, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'

import { Hkt, Initial } from './Hkt'
import { Resume } from './Resume'

export type FromResume<F> = {
  readonly URI?: F
  readonly fromResume: <A>(resume: Resume<A>) => HKT<F, A>
}

export type FromResume1<F extends URIS> = {
  readonly URI?: F
  readonly fromResume: <A>(resume: Resume<A>) => Hkt<F, [A]>
}

export type FromResume2<F extends URIS2> = {
  readonly URI?: F
  readonly fromResume: <A, E = Initial<F, 'E'>>(resume: Resume<A>) => Hkt<F, [E, A]>
}

export type FromResume2C<F extends URIS2, E> = {
  readonly URI?: F
  readonly fromResume: <A>(resume: Resume<A>) => Hkt<F, [E, A]>
}

export type FromResume3<F extends URIS3> = {
  readonly URI?: F
  readonly fromResume: <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
    resume: Resume<A>,
  ) => Hkt<F, [R, E, A]>
}

export type FromResume3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromResume: <A, R = Initial<F, 'R'>>(resume: Resume<A>) => Hkt<F, [R, E, A]>
}

export type FromResume4<F extends URIS4> = {
  readonly URI?: F
  readonly fromResume: <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
    resume: Resume<A>,
  ) => Hkt<F, [S, R, E, A]>
}

export function fromResumeK<F extends URIS>(
  F: FromResume1<F>,
): <A extends readonly any[], B>(f: (...args: A) => Resume<B>) => (...args: A) => Hkt<F, [B]>

export function fromResumeK<F extends URIS2>(
  F: FromResume2<F>,
): <A extends readonly any[], B>(f: (...args: A) => Resume<B>) => <E>(...args: A) => Hkt<F, [E, B]>

export function fromResumeK<F extends URIS3>(
  F: FromResume3<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => Resume<B>,
) => <R, E>(...args: A) => Hkt<F, [R, E, B]>

export function fromResumeK<F extends URIS4>(
  F: FromResume4<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => Resume<B>,
) => <S, R, E>(...args: A) => Hkt<F, [S, R, E, B]>

export function fromResumeK<F>(
  F: FromResume<F>,
): <A extends readonly any[], B>(f: (...args: A) => Resume<B>) => (...args: A) => Hkt<F, [B]>

export function fromResumeK<F>(F: FromResume<F>) {
  return <A extends readonly any[], B>(f: (...args: A) => Resume<B>) => (...args: A): HKT<F, B> =>
    F.fromResume(f(...args))
}

export function chainResumeK<F extends URIS>(
  F: FromResume1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>

export function chainResumeK<F extends URIS2>(
  F: FromResume2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => Resume<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, B]>

export function chainResumeK<F extends URIS3>(
  F: FromResume3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => Resume<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, B]>

export function chainResumeK<F extends URIS4>(
  F: FromResume4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => Resume<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, B]>

export function chainResumeK<F>(
  F: FromResume<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>

export function chainResumeK<F>(
  F: FromResume<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => Resume<B>) => (hkt: HKT<F, A>) => HKT<F, B> {
  return (f) => C.chain(flow(f, F.fromResume) as any)
}

export function chainFirstResumeK<F extends URIS>(
  F: FromResume1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>

export function chainFirstResumeK<F extends URIS2>(
  F: FromResume2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => Resume<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, A]>

export function chainFirstResumeK<F extends URIS3>(
  F: FromResume3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => Resume<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, A]>

export function chainFirstResumeK<F extends URIS4>(
  F: FromResume4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => Resume<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, A]>

export function chainFirstResumeK<F>(
  F: FromResume<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>

export function chainFirstResumeK<F>(
  F: FromResume<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => Resume<B>) => (hkt: HKT<F, A>) => HKT<F, A> {
  const chainF = chainFirst(C)

  return (f) => chainF(flow(f, F.fromResume) as any)
}
