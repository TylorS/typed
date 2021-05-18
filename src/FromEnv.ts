import { Chain, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'
import { HKT, HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import {
  NaturalTransformation22,
  NaturalTransformation23R,
  NaturalTransformation23RC,
  NaturalTransformation24R,
} from 'fp-ts/NaturalTransformation'

import * as E from './Env'
import { ApplyVariance, Hkt } from './Hkt'

export type FromEnv<F> = {
  readonly URI?: F
  readonly fromEnv: <E, A>(resume: E.Env<E, A>) => HKT2<F, E, A>
}

export type FromEnv2<F extends URIS2> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation22<E.URI, F>
}

export type FromEnv3<F extends URIS3> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation23R<E.URI, F>
}

export type FromEnv3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation23RC<E.URI, F, E>
}

export type FromEnv4<F extends URIS4> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation24R<E.URI, F>
}

export function fromEnvK<F extends URIS2>(
  F: FromEnv2<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => E.Env<R, B>,
) => (...args: A) => Hkt<F, [R, B]>

export function fromEnvK<F extends URIS3>(
  F: FromEnv3<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => E.Env<R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>

export function fromEnvK<F extends URIS4>(
  F: FromEnv4<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => E.Env<R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>

export function fromEnvK<F>(
  F: FromEnv<F>,
): <A extends readonly any[], E, B>(
  f: (...args: A) => E.Env<E, B>,
) => (...args: A) => Hkt<F, [E, B]>

export function fromEnvK<F>(F: FromEnv<F>) {
  return <A extends readonly any[], E, B>(f: (...args: A) => E.Env<E, B>) => (...args: A) =>
    F.fromEnv(f(...args))
}

export function chainEnvK<F extends URIS2>(
  F: FromEnv2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainEnvK<F extends URIS3>(
  F: FromEnv3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainEnvK<F extends URIS4>(
  F: FromEnv4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R, B>(f: (value: A) => E.Env<R, B>) => (hkt: HKT<F, A>) => HKT<F, B> {
  return (f) => C.chain(flow(f, F.fromEnv) as any)
}

export function chainFirstEnvK<F extends URIS2>(
  F: FromEnv2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstEnvK<F extends URIS3>(
  F: FromEnv3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstEnvK<F extends URIS4>(
  F: FromEnv4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, E, B>(f: (value: A) => E.Env<E, B>) => (hkt: HKT<F, A>) => HKT<F, A> {
  const chainF = chainFirst(C)

  return (f) => chainF(flow(f, F.fromEnv) as any)
}
