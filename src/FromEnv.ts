import { Chain, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'
import { HKT, HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'
import {
  NaturalTransformation22,
  NaturalTransformation23R,
  NaturalTransformation23RC,
  NaturalTransformation24R,
} from 'fp-ts/NaturalTransformation'

import * as E from './Env'
import { ApplyVariance, Hkt, Initial } from './Hkt'
import * as Provide from './Provide'

export type FromEnv<F> = {
  readonly URI?: F
  readonly fromEnv: <E, A>(env: E.Env<E, A>) => HKT2<F, E, A>
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
  return <A extends readonly any[], E, B>(f: (...args: A) => E.Env<E, B>) =>
    (...args: A) =>
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

export function provideSomeWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.ProvideSome4<F> & Chain4<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export function provideSomeWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.ProvideSome3<F> & Chain3<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export function provideSomeWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.ProvideSome2<F> & Chain2<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider2<F, A, E>
export function provideSomeWithEnv<F>(
  F: FromEnv<F> & Provide.ProvideSome<F> & Chain<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider<F, A, E>
export function provideSomeWithEnv<F>(F: FromEnv<F> & Provide.ProvideSome<F> & Chain<F>) {
  return flow(F.fromEnv, Provide.provideSomeWith(F))
}

export function provideAllWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.ProvideAll4<F> & Chain4<F>,
): <R, A>(resume: E.Env<R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export function provideAllWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.ProvideAll3<F> & Chain3<F>,
): <R, A>(resume: E.Env<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export function provideAllWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.ProvideAll2<F> & Chain2<F>,
): <E, A>(resume: E.Env<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export function provideAllWithEnv<F>(
  F: FromEnv<F> & Provide.ProvideAll<F> & Chain<F>,
): <E, A>(resume: E.Env<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
export function provideAllWithEnv<F>(F: FromEnv<F> & Provide.ProvideAll<F> & Chain<F>) {
  return flow(F.fromEnv, Provide.provideAllWith(F))
}

export function useSomeWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.UseSome4<F> & Chain4<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export function useSomeWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.UseSome3<F> & Chain3<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export function useSomeWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.UseSome2<F> & Chain2<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider2<F, A, E>
export function useSomeWithEnv<F>(
  F: FromEnv<F> & Provide.UseSome<F> & Chain<F>,
): <E, A>(resume: E.Env<E, A>) => Provide.Provider<F, A, E>
export function useSomeWithEnv<F>(F: FromEnv<F> & Provide.UseSome<F> & Chain<F>) {
  return flow(F.fromEnv, Provide.useSomeWith(F))
}

export function useAllWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.UseAll4<F> & Chain4<F>,
): <R, A>(resume: E.Env<R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export function useAllWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.UseAll3<F> & Chain3<F>,
): <R, A>(resume: E.Env<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export function useAllWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.UseAll2<F> & Chain2<F>,
): <E, A>(resume: E.Env<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export function useAllWithEnv<F>(
  F: FromEnv<F> & Provide.UseAll<F> & Chain<F>,
): <E, A>(resume: E.Env<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
export function useAllWithEnv<F>(F: FromEnv<F> & Provide.UseAll<F> & Chain<F>) {
  return flow(F.fromEnv, Provide.useAllWith(F))
}
