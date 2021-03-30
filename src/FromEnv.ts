import { ApplyVariance, Hkt } from './Hkt'
import { Env } from './Env'
import { HKT, HKT2, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import { Chain, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'

export type FromEnv<F> = {
  readonly URI?: F
  readonly fromEnv: <E, A>(resume: Env<E, A>) => HKT2<F, E, A>
}

export type FromEnv2<F extends URIS2> = {
  readonly URI?: F
  readonly fromEnv: <E, A>(resume: Env<E, A>) => Hkt<F, [E, A]>
}

export type FromEnv3<F extends URIS3> = {
  readonly URI?: F
  readonly fromEnv: <R, A, E = never>(resume: Env<R, A>) => Hkt<F, [R, E, A]>
}

export type FromEnv3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromEnv: <R, A>(resume: Env<R, A>) => Hkt<F, [R, E, A]>
}

export type FromEnv4<F extends URIS4> = {
  readonly URI?: F
  readonly fromEnv: <R, A, S = unknown, E = never>(resume: Env<R, A>) => Hkt<F, [S, R, E, A]>
}

export function fromEnvK<F extends URIS2>(
  F: FromEnv2<F>,
): <A extends readonly any[], R, B>(f: (...args: A) => Env<R, B>) => (...args: A) => Hkt<F, [R, B]>

export function fromEnvK<F extends URIS3>(
  F: FromEnv3<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => Env<R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>

export function fromEnvK<F extends URIS4>(
  F: FromEnv4<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => Env<R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>

export function fromEnvK<F>(
  F: FromEnv<F>,
): <A extends readonly any[], E, B>(f: (...args: A) => Env<E, B>) => (...args: A) => Hkt<F, [E, B]>

export function fromEnvK<F>(F: FromEnv<F>) {
  return <A extends readonly any[], E, B>(f: (...args: A) => Env<E, B>) => (...args: A) =>
    F.fromEnv(f(...args))
}

export function chainEnvK<F extends URIS2>(
  F: FromEnv2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainEnvK<F extends URIS3>(
  F: FromEnv3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainEnvK<F extends URIS4>(
  F: FromEnv4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R, B>(f: (value: A) => Env<R, B>) => (hkt: HKT<F, A>) => HKT<F, B> {
  return (f) => C.chain(flow(f, F.fromEnv) as any)
}

export function chainFirstEnvK<F extends URIS2>(
  F: FromEnv2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstEnvK<F extends URIS3>(
  F: FromEnv3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstEnvK<F extends URIS4>(
  F: FromEnv4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, E, B>(f: (value: A) => Env<E, B>) => (hkt: HKT<F, A>) => HKT<F, A> {
  const chainF = chainFirst(C)

  return (f) => chainF(flow(f, F.fromEnv) as any)
}
