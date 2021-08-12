/**
 * FromKV is a Typeclass which represents the Natural Transformation from an KV into another
 * effect.
 *
 * @since 0.11.0
 */
import { Chain, Chain2, Chain3, Chain4, chainFirst } from 'fp-ts/Chain'
import { flow } from 'fp-ts/function'
import { HKT, HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/HKT'

import { ApplyVariance, Hkt, Initial } from './HKT'
import * as KV from './KV'
import * as Provide from './Provide'

/**
 * @since 0.11.0
 * @category Typeclass
 */
export type FromKV<F, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, E, A>(KV: KV.KV<K, E, A>) => HKT2<F, E & Extra, A>
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export type FromKV2<F extends URIS2, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, E, A>(KV: KV.KV<K, E, A>) => Kind2<F, E & Extra, A>
}

/**
 * @since 0.11.0
 * @category Typeclass
 */
export type FromKV3<F extends URIS3, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, R, A, E = Initial<F, 'E'>>(KV: KV.KV<K, R, A>) => Kind3<F, R & Extra, E, A>
}

/**
 * @since 0.11.0
 * @category Typeclass
 */
export type FromKV3C<F extends URIS3, E, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, R, A>(KV: KV.KV<K, R, A>) => Kind3<F, R & Extra, E, A>
}

/**
 * @since 0.11.0
 * @category Typeclass
 */
export type FromKV4<F extends URIS4, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, R, A, S = Initial<F, 'S'>, E = Initial<F, 'E'>>(
    KV: KV.KV<K, R, A>,
  ) => Kind4<F, S, R & Extra, E, A>
}

/**
 * @since 0.11.0
 * @category Constructor
 */
export function fromKVK<F extends URIS2>(
  F: FromKV2<F>,
): <A extends readonly any[], K, R, B>(
  f: (...args: A) => KV.KV<K, R, B>,
) => (...args: A) => Hkt<F, [R, B]>

export function fromKVK<F extends URIS3>(
  F: FromKV3<F>,
): <A extends readonly any[], K, R, B>(
  f: (...args: A) => KV.KV<K, R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>

export function fromKVK<F extends URIS4>(
  F: FromKV4<F>,
): <A extends readonly any[], K, R, B>(
  f: (...args: A) => KV.KV<K, R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>

export function fromKVK<F>(
  F: FromKV<F>,
): <A extends readonly any[], K, E, B>(
  f: (...args: A) => KV.KV<K, E, B>,
) => (...args: A) => Hkt<F, [E, B]>

export function fromKVK<F>(F: FromKV<F>) {
  return <A extends readonly any[], K, E, B>(f: (...args: A) => KV.KV<K, E, B>) =>
    (...args: A) =>
      F.fromKV(f(...args))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainKVK<F extends URIS2>(
  F: FromKV2<F>,
  C: Chain2<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainKVK<F extends URIS3>(
  F: FromKV3<F>,
  C: Chain3<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainKVK<F extends URIS4>(
  F: FromKV4<F>,
  C: Chain4<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>

export function chainKVK<F>(
  F: FromKV<F>,
  C: Chain<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>

export function chainKVK<F>(
  F: FromKV<F>,
  C: Chain<F>,
): <A, K, R, B>(f: (value: A) => KV.KV<K, R, B>) => (hkt: HKT<F, A>) => HKT<F, B> {
  return (f) => C.chain(flow(f, F.fromKV) as any)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function chainFirstKVK<F extends URIS2>(
  F: FromKV2<F>,
  C: Chain2<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstKVK<F extends URIS3>(
  F: FromKV3<F>,
  C: Chain3<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstKVK<F extends URIS4>(
  F: FromKV4<F>,
  C: Chain4<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>

export function chainFirstKVK<F>(
  F: FromKV<F>,
  C: Chain<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>

export function chainFirstKVK<F>(
  F: FromKV<F>,
  C: Chain<F>,
): <A, K, E, B>(f: (value: A) => KV.KV<K, E, B>) => (hkt: HKT<F, A>) => HKT<F, A> {
  const chainF = chainFirst(C)

  return (f) => chainF(flow(f, F.fromKV) as any)
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function provideSomeWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.ProvideSome4<F> & Chain4<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export function provideSomeWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.ProvideSome3<F> & Chain3<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export function provideSomeWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.ProvideSome2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider2<F, A, E>
export function provideSomeWithKV<F>(
  F: FromKV<F> & Provide.ProvideSome<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider<F, A, E>
export function provideSomeWithKV<F>(F: FromKV<F> & Provide.ProvideSome<F> & Chain<F>) {
  return flow(F.fromKV, Provide.provideSomeWith(F))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function provideAllWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.ProvideAll4<F> & Chain4<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export function provideAllWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.ProvideAll3<F> & Chain3<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export function provideAllWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.ProvideAll2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export function provideAllWithKV<F>(
  F: FromKV<F> & Provide.ProvideAll<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
export function provideAllWithKV<F>(F: FromKV<F> & Provide.ProvideAll<F> & Chain<F>) {
  return flow(F.fromKV, Provide.provideAllWith(F))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function useSomeWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.UseSome4<F> & Chain4<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export function useSomeWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.UseSome3<F> & Chain3<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export function useSomeWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.UseSome2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider2<F, A, E>
export function useSomeWithKV<F>(
  F: FromKV<F> & Provide.UseSome<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider<F, A, E>
export function useSomeWithKV<F>(F: FromKV<F> & Provide.UseSome<F> & Chain<F>) {
  return flow(F.fromKV, Provide.useSomeWith(F))
}

/**
 * @since 0.11.0
 * @category Combinator
 */
export function useAllWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.UseAll4<F> & Chain4<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export function useAllWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.UseAll3<F> & Chain3<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export function useAllWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.UseAll2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export function useAllWithKV<F>(
  F: FromKV<F> & Provide.UseAll<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
export function useAllWithKV<F>(F: FromKV<F> & Provide.UseAll<F> & Chain<F>) {
  return flow(F.fromKV, Provide.useAllWith(F))
}
